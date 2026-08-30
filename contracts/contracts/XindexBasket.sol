// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

interface IERC20Metadata is IERC20 {
    function decimals() external view returns (uint8);
}

library SafeToken {
    error TokenCallFailed();
    function safeTransfer(IERC20 token, address to, uint256 amount) internal {
        (bool ok, bytes memory data) = address(token).call(abi.encodeCall(token.transfer, (to, amount)));
        if (!ok || (data.length != 0 && !abi.decode(data, (bool)))) revert TokenCallFailed();
    }
    function safeTransferFrom(IERC20 token, address from, address to, uint256 amount) internal {
        (bool ok, bytes memory data) = address(token).call(abi.encodeCall(token.transferFrom, (from, to, amount)));
        if (!ok || (data.length != 0 && !abi.decode(data, (bool)))) revert TokenCallFailed();
    }
}

contract BasketToken {
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;
    uint256 public totalSupply;
    address public immutable vault;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    error Unauthorized();
    error ZeroAddress();
    error InsufficientBalance();
    error InsufficientAllowance();

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    constructor(string memory tokenName, string memory tokenSymbol, address vault_) {
        if (vault_ == address(0)) revert ZeroAddress();
        name = tokenName;
        symbol = tokenSymbol;
        vault = vault_;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 permitted = allowance[from][msg.sender];
        if (permitted != type(uint256).max) {
            if (permitted < amount) revert InsufficientAllowance();
            allowance[from][msg.sender] = permitted - amount;
        }
        _transfer(from, to, amount);
        return true;
    }

    function mint(address to, uint256 amount) external {
        if (msg.sender != vault) revert Unauthorized();
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function burnFrom(address from, uint256 amount) external {
        if (msg.sender != vault) revert Unauthorized();
        if (balanceOf[from] < amount) revert InsufficientBalance();
        balanceOf[from] -= amount;
        totalSupply -= amount;
        emit Transfer(from, address(0), amount);
    }

    function _transfer(address from, address to, uint256 amount) internal {
        if (to == address(0)) revert ZeroAddress();
        if (balanceOf[from] < amount) revert InsufficientBalance();
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
    }
}

contract BasketVault {
    using SafeToken for IERC20;

    uint256 private constant ONE = 1e18;
    uint256 private constant BPS = 10_000;
    BasketToken public immutable basketToken;
    address public immutable admin;
    address public pauser;
    address public feeRecipient;
    uint16 public immutable depositFeeBps;
    uint16 public immutable redeemFeeBps;
    bool public paused;
    uint256 private locked = 1;
    IERC20[] private componentTokens;
    uint256[] private unitsPerShare;
    uint8[] private componentDecimals;

    error Unauthorized();
    error InvalidConfiguration();
    error Paused();
    error Reentrancy();
    error DeadlineExpired();
    error Slippage();
    error ZeroAmount();
    error UnsupportedTokenBehavior();

    event Deposited(address indexed caller, address indexed receiver, uint256 shares);
    event Redeemed(address indexed caller, address indexed receiver, uint256 shares);
    event PauseChanged(bool paused);
    event PauserChanged(address indexed pauser);

    modifier onlyAdmin() { if (msg.sender != admin) revert Unauthorized(); _; }
    modifier nonReentrant() {
        if (locked != 1) revert Reentrancy();
        locked = 2;
        _;
        locked = 1;
    }
    modifier whenNotPaused() { if (paused) revert Paused(); _; }

    constructor(
        string memory tokenName,
        string memory tokenSymbol,
        address[] memory components_,
        uint8[] memory decimals_,
        uint256[] memory units_,
        address admin_,
        address pauser_,
        address feeRecipient_,
        uint16 depositFeeBps_,
        uint16 redeemFeeBps_
    ) {
        if (
            admin_ == address(0) || pauser_ == address(0) ||
            feeRecipient_ == address(0) || components_.length == 0 ||
            components_.length != units_.length || components_.length != decimals_.length || depositFeeBps_ > 100 ||
            redeemFeeBps_ > 100
        ) revert InvalidConfiguration();
        for (uint256 i; i < components_.length; ++i) {
            if (
                components_[i] == address(0) || units_[i] == 0 ||
                IERC20Metadata(components_[i]).decimals() != decimals_[i]
            ) revert InvalidConfiguration();
            componentTokens.push(IERC20(components_[i]));
            unitsPerShare.push(units_[i]);
            componentDecimals.push(decimals_[i]);
        }
        basketToken = new BasketToken(tokenName, tokenSymbol, address(this));
        admin = admin_;
        pauser = pauser_;
        feeRecipient = feeRecipient_;
        depositFeeBps = depositFeeBps_;
        redeemFeeBps = redeemFeeBps_;
    }

    function componentCount() external view returns (uint256) { return componentTokens.length; }
    function component(uint256 index) external view returns (address, uint8, uint256) {
        return (address(componentTokens[index]), componentDecimals[index], unitsPerShare[index]);
    }

    function previewDeposit(uint256 shares) public view returns (uint256[] memory required, uint256[] memory fees) {
        required = new uint256[](componentTokens.length);
        fees = new uint256[](componentTokens.length);
        for (uint256 i; i < componentTokens.length; ++i) {
            required[i] = _mulDivUp(shares, unitsPerShare[i], ONE);
            fees[i] = _mulDivUp(required[i], depositFeeBps, BPS);
        }
    }

    function deposit(uint256 shares, uint256[] calldata maxAmounts, address receiver, uint256 deadline)
        external nonReentrant whenNotPaused returns (uint256[] memory required)
    {
        if (block.timestamp > deadline) revert DeadlineExpired();
        if (shares == 0 || receiver == address(0)) revert ZeroAmount();
        uint256[] memory fees;
        (required, fees) = previewDeposit(shares);
        if (maxAmounts.length != required.length) revert InvalidConfiguration();
        for (uint256 i; i < required.length; ++i) {
            uint256 total = required[i] + fees[i];
            if (total > maxAmounts[i]) revert Slippage();
            uint256 beforeBalance = componentTokens[i].balanceOf(address(this));
            componentTokens[i].safeTransferFrom(msg.sender, address(this), required[i]);
            if (componentTokens[i].balanceOf(address(this)) - beforeBalance != required[i]) {
                revert UnsupportedTokenBehavior();
            }
            if (fees[i] != 0) componentTokens[i].safeTransferFrom(msg.sender, feeRecipient, fees[i]);
        }
        basketToken.mint(receiver, shares);
        emit Deposited(msg.sender, receiver, shares);
    }

    function previewRedeem(uint256 shares) public view returns (uint256[] memory gross, uint256[] memory fees) {
        uint256 supply = basketToken.totalSupply();
        if (supply == 0) return (new uint256[](componentTokens.length), new uint256[](componentTokens.length));
        gross = new uint256[](componentTokens.length);
        fees = new uint256[](componentTokens.length);
        for (uint256 i; i < componentTokens.length; ++i) {
            gross[i] = componentTokens[i].balanceOf(address(this)) * shares / supply;
            fees[i] = gross[i] * redeemFeeBps / BPS;
        }
    }

    function redeem(uint256 shares, uint256[] calldata minAmounts, address receiver, uint256 deadline)
        external nonReentrant whenNotPaused returns (uint256[] memory net)
    {
        if (block.timestamp > deadline) revert DeadlineExpired();
        if (shares == 0 || receiver == address(0)) revert ZeroAmount();
        (uint256[] memory gross, uint256[] memory fees) = previewRedeem(shares);
        if (minAmounts.length != gross.length) revert InvalidConfiguration();
        basketToken.burnFrom(msg.sender, shares);
        net = new uint256[](gross.length);
        for (uint256 i; i < gross.length; ++i) {
            net[i] = gross[i] - fees[i];
            if (net[i] < minAmounts[i]) revert Slippage();
            componentTokens[i].safeTransfer(receiver, net[i]);
            if (fees[i] != 0) componentTokens[i].safeTransfer(feeRecipient, fees[i]);
        }
        emit Redeemed(msg.sender, receiver, shares);
    }

    function setPaused(bool state) external {
        if (msg.sender != pauser && msg.sender != admin) revert Unauthorized();
        paused = state;
        emit PauseChanged(state);
    }

    function setPauser(address newPauser) external onlyAdmin {
        if (newPauser == address(0)) revert InvalidConfiguration();
        pauser = newPauser;
        emit PauserChanged(newPauser);
    }

    function _mulDivUp(uint256 x, uint256 y, uint256 denominator) private pure returns (uint256) {
        if (x == 0 || y == 0) return 0;
        return ((x * y) - 1) / denominator + 1;
    }
}
