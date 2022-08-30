import * as ethers from 'ethers';

export const provider = new ethers.providers.JsonRpcProvider('http://149.56.22.113:8545');

export const RUM_ERC20_ABI = [
  'constructor(string name_, string symbol_, uint256 cap, address minter)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function name() view returns (string)',
  'function rumApprove(address spender, uint256 amount, string uuid) returns (bool)',
  'function rumTransfer(address recipient, uint256 amount, string uuid) returns (bool)',
  'function rumTransferFrom(address sender, address recipient, uint256 amount, string uuid) returns (bool)',
  'function symbol() view returns (string)',
  'function totalSupply() view returns (uint256)',
  'function transfer(address recipient, uint256 amount) returns (bool)',
  'function transferFrom(address sender, address recipient, uint256 amount) returns (bool)',
];

export const RUM_ACCOUNT_ABI = [
  'constructor()',
  'event Bind(address user, string indexed payment_provider, string payment_account, string meta, string memo)',
  'event UnBind(address user, string indexed payment_provider)',
  'function account(address, string) view returns (address user, string payment_provider, string payment_account, string meta, string memo)',
  'function managers(address) view returns (bool)',
  'function owner() view returns (address)',
  'function userAddress(string, string) view returns (address)',
  'function changeOwner(address newOwner)',
  'function addManager(address manager)',
  'function removeManager(address manager)',
  'function bind(address user, string payment_provider, string payment_account, string meta, string memo)',
  'function selfBind(string payment_provider, string payment_account, string meta, string memo)',
  'function unBind(address user, string payment_provider)',
  'function selfUnBind(string payment_provider)',
  'function accounts(address user) view returns (tuple(address user, string payment_provider, string payment_account, string meta, string memo)[])',
  'function providerUsersCount(string payment_provider) view returns (uint256)',
];

export const RUM_ACCOUNT_CONTRACT_ADDRESS = '0x03d0217c1e00E0A5eE3534Ea88D0108bF872bAD1';

export const WITHDRAW_TO = '0xF0E75E53f0AEC66E9536c7D9c7afCDB140aCDE19';
