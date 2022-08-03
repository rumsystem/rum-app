import * as ethers from 'ethers';
import MVMApi from 'apis/mvm';
import sleep from 'utils/sleep';

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

export const PAID_GROUP_ABI = [
  'event AlreadyPaid(address indexed user, tuple(uint128 groupId, uint256 amount, address tokenAddr, uint256 expiredAt) member)',
  'event AnnouncePrice(uint128 indexed groupId, tuple(address owner, address tokenAddr, uint256 amount, uint64 duration) price)',
  'event UpdatePrice(uint128 indexed groupId, tuple(address owner, address tokenAddr, uint256 amount, uint64 duration) price)',
  'function addPrice(uint128 _groupId, uint64 _duration, address _tokenAddr, uint256 _amount) payable',
  'function getBalance() view returns (uint256)',
  'function getDappInfo() view returns (tuple(string name, string version, string developer, address receiver, address deployer, uint256 invokeFee, uint64 shareRatio))',
  'function getMemberKey(address user, uint128 groupId) pure returns (bytes)',
  'function getPaidDetail(address user, uint128 groupId) view returns (tuple(uint128 groupId, uint256 amount, address tokenAddr, uint256 expiredAt))',
  'function getPrice(uint128 _groupId) view returns (tuple(address owner, address tokenAddr, uint256 amount, uint64 duration))',
  'function initialize(string _version, uint256 _invokeFee, uint64 _shareRatio)',
  'function isEqualString(string a, string b) pure returns (bool)',
  'function isPaid(address user, uint128 groupId) view returns (bool)',
  'function memberList(bytes) view returns (uint128 groupId, uint256 amount, address tokenAddr, uint256 expiredAt)',
  'function pay(uint128 groupId) payable',
  'function toBytes(uint256 x) pure returns (bytes b)',
  'function updateDappInfo(string _version, uint256 _invokeFee, uint64 _shareRatio)',
  'function updatePrice(uint128 _groupId, uint64 _duration, address _tokenAddr, uint256 _amount) payable',
];

export const RUM_ACCOUNT_CONTRACT_ADDRESS = '0x03d0217c1e00E0A5eE3534Ea88D0108bF872bAD1';

export const WITHDRAW_TO = '0xF0E75E53f0AEC66E9536c7D9c7afCDB140aCDE19';

export const getExploreTxUrl = (txHash: string) => `https://explorer.rumsystem.net/tx/${txHash}`;

export const PAID_GROUP_CONTRACT_ADDRESS = '0xA8815021Cdb005677d81f11116eBC501b3018589';

export const getFee = async (address: string) => {
  try {
    const balanceWEI = await provider.getBalance(address);
    const balanceETH = ethers.utils.formatEther(balanceWEI);
    const notEnoughFee = parseInt(balanceETH, 10) < 1;
    if (notEnoughFee) {
      await MVMApi.requestFee({
        account: address,
      });
      await sleep(2000);
    }
  } catch {}
};

export const uuidToBigInt = (uuid: string) => ethers.BigNumber.from('0x' + uuid.replace(/-/g, ''));
