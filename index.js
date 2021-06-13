// Etherscan API key
const etherscan_api_key = "6AMB9PGBYJ5AHHCZHCCZAU5Y7E4KEVET47"

// Wallet Addresses
const metamask_address = "0x97BAd4347C45b8DF0F4ebf24D8F0250c8366F8ef"
const ledger_address = "0xD806e6019AC21714B3B96b0731DD0715Ef2f08AC"
var ethWalletAddress = ledger_address

// Contract addresses
var chainlinkContract = "0x514910771af9ca656af840dff83e8264ecf986ca";
var shopxContract = "0x7BEF710a5759d197EC0Bf621c3Df802C2D60D848";
var paidContract = "0x8c8687fC965593DFb2F0b4EAeFD55E9D8df348df";
var aaveContract = "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9"
var stakedAaveContract = "0x4da27a545c0c5B758a6BA100e3a049001de870f5"
var b20Contract = "0xc4De189Abf94c57f396bD4c52ab13b954FebEfD8"
var aiozContract = "0x626E8036dEB333b408Be468F951bdB42433cBF18"
var croContract = "0xA0b73E1Ff0B80914AB6fe0444E65848C4C34450b"

// Instanciating Web3 object
let web3 = new Web3(Web3.givenProvider || "ws://localhost:8545");

// ############################### Start Definitions ###############################

function decimals_to_units(tokenUnits, decimals) {
    `
    Converts token units to 'human-friendly' decimal notation
    Arguments:
        1) Token units in original format
        2) Number of decimals the token has
    `
    if (tokenUnits === "unavailable") {
        return tokenUnits;
    }
    let decimalsInt = parseInt(decimals);
    let tokenUnit = tokenUnits.slice(0, -decimalsInt) + "." + tokenUnits.slice(-decimalsInt);
    return parseFloat(tokenUnit);
}

async function getTokenInfo(smartContractAddress, ethWalletAddress) {
    `
    Retrieves token information provided by smart contract
    Arguments:
        1) Smart contract address of the token of interest
        2) Ethereum wallet address of the wallet you want to find balance of given token
    `
    // ABI endpoint provided by Etherscan
    let etherscan_abi_endpoint = `https://api.etherscan.io/api?module=contract&action=getabi&address=${smartContractAddress}&apikey=${etherscan_api_key}`
    // Call the endpoint
    let abi = await d3.json(etherscan_abi_endpoint);
    // Create Web3 contract object
    let contract = new web3.eth.Contract(JSON.parse(abi.result), smartContractAddress);
    // Unit Decimals
    try {
        var decimals = await contract.methods.decimals().call();
    } catch (error) {
        var decimals = "0";
    }
    // Balance on Ethereum wallet
    try {
        var balance = await contract.methods.balanceOf(ethWalletAddress).call();
    } catch (error) {
        var balance = "unavailable";
    }
    // Token Name
    try {
        var name = await contract.methods.name().call();
    } catch (error) {
        var name = "unavailable";
    }
    // Total Supply
    try {
        var totalSupply = await contract.methods.totalSupply().call();
    } catch (error) {
        var totalSupply = "unavailable";
    }
    // Token Symbol
    try {
        var tokenSymbol = await contract.methods.symbol().call();
    } catch (error) {
        var tokenSymbol = "unavailable";
    }
    return {
        "Token Name": name,
        "Token Symbol": tokenSymbol,
        "Wallet Balance": decimals_to_units(balance, decimals),
        "Token Total Supply": decimals_to_units(totalSupply, decimals),
    }
}

function updateTokenInfo(contractAddress, ethWalletAddress) {
    `
    Gets token information/ balance infomation for given contract and wallet addresses
    `
    // Remove old information if present
    let tokenInfo1 = d3.select("#token-information").selectAll("p")
    let tokenInfo2 = d3.select("#token-information").selectAll("h3")
    if (tokenInfo1) {tokenInfo1.remove();}
    if (tokenInfo2) {tokenInfo2.remove();}
    
    // Add new token information to page
    getTokenInfo(contractAddress, ethWalletAddress)
        // Use promise returned to display information
        .then(info => {
            d3.select("#token-information").append("h3").text("ERC-20 Token Balance")
            Object.entries(info).forEach(elem => {
                d3.select("#token-information")
                    .append("p")
                    .text(`${elem[0]}: ${elem[1]}`);
            })
        })
        // Catch error if getTokenInfo() throws error and display message
        .catch(error => {
            d3.select("#token-information")
                .append("p")
                .text(`Cannot load token information due to query error: ${error}`);
        });
    }

function handleTextInputs() {
    `
    Adds data to webpage when appropriate user inputs are provided
    `
    // Capture Input values
    var walletAdd = document.getElementById("wallet-address").value;
    var contractAdd = document.getElementById("contract-address").value;
    // Display ETH balance
    if (walletAdd) {
        // Check if wallet address is valid
        if (web3.utils.isAddress(walletAdd)) {
            getEthBalance(walletAdd);
        } else {
            console.log("Wallet address not valid");
        }
    }
    // Ensure both values are present to display token info
    if (!walletAdd) {
        console.log("No ETH wallet address provided");
    } else if (!contractAdd) {
        console.log("No smart contract address provided");
    } else {
        // Check if smart contract address is valid
        if (web3.utils.isAddress(contractAdd)) {
            updateTokenInfo(contractAdd, walletAdd);
        } else {
            console.log("Contract address not valid")
        }
    }
}

function getEthBalance(ethAddress) {
    `
    Gets Ethereum token balance of given wallet address
    `
    // Remove old information if present
    let ethBalanceInfo1 = d3.select("#eth-balance").selectAll("p");
    let ethBalanceInfo2 = d3.select("#eth-balance").selectAll("h3");
    if (ethBalanceInfo1) {ethBalanceInfo1.remove();}
    if (ethBalanceInfo2) {ethBalanceInfo2.remove();}
    // Add new ETH balance information to page
    web3.eth.getBalance(ethAddress)
        .then(balance => {
            // Convert Wei to Eth
            let ethBalance = web3.utils.fromWei(balance, "ether");
            // Add to webpage
            d3.select("#eth-balance").append("h3").text("Wallet's ETH Balance")
            d3.select("#eth-balance").append("p").text(`ETH Balance: ${ethBalance}`);
        })
        .catch(error => {
            d3.select("#eth-balance").append("p").text(`Cannot load ETH balance due to query error: ${error}`);
        })
    }

function displayBlockInformation(blockNumber="latest", transactionDisplay=false) {
    `
    Displays block information
    Arguments:
        1) blockNumber - Block number or block hash of block to display
        2) transactionDisplay - If true: display full transactions, if false: display hashed transactions
    `
    blockInfoElem = d3.select("#block-information");
    // Remove old information if present
    blockInfoElem.selectAll("p").remove()
    // Add remove information button
    var x = document.getElementById("block-remove-button");
    x.style.display = "block";
    web3.eth.getBlock(blockNumber, transactionDisplay).then(data => {
        // Display number of block transactions
        web3.eth.getBlockTransactionCount(blockNumber).then(numTransactions => {
            blockInfoElem.append("p").text(`number of transactions: ${numTransactions}`);
        })
        // Display block data
        blockData = Object.entries(data);
        blockData.forEach(elem => {
            blockInfoElem
                .append("p")
                .text(`${elem[0]}: ${elem[1]}`);
        })
    });
}

function removeBlockInfo() {
    // Remove old information if present
    blockInfoElem = d3.select("#block-information");
    blockInfoElem.selectAll("p").remove()
    // Remove removeBlockButton
    var x = document.getElementById("block-remove-button");
    x.style.display = "none";
    // Add back helper text
    d3.select("#block-info-header").append("p").text("Click this button to get the latest blockchain information")
}

function isHash() {
    `
    Determines if text entered is a hex value. Displays true or false based on result.
    `
    // Remove old information if present
    let oldInfo = d3.select("#hash-test-container").selectAll("p")
    if (oldInfo) {oldInfo.remove()}
    // Get inputted value
    let hash = document.getElementById("hash-test").value;
    // Determine if hex
    let result = web3.utils.isHex(hash);
    // Display on web page
    d3.select("#hash-test-container").append("p").text(result);
}

function textToHash() {
    `
    Converts text input to hex. Displays on web page.
    `
    // Remove old information if present
    let oldInfo = d3.select("#hash-factory-container").selectAll("p")
    if (oldInfo) {oldInfo.remove()}
    // Get inputted value
    let text = document.getElementById("hash-factory").value;
    // Create hash
    let hash = web3.utils.toHex(text);
    // Add hash to web page
    d3.select("#hash-factory-container").append("p").text(hash);
}

function hashToText() {
    `
    Converts hex to UTF-8 plain text. Displays on web page.
    `
    // Remove old information if present
    let oldInfo = d3.select("#hash-to-text-container").selectAll("p")
    if (oldInfo) {oldInfo.remove()}
    // Get inputted value
    let hash = document.getElementById("hash-to-text").value;
    // Convert hash to text
    let text = web3.utils.hexToUtf8(hash);
    // Add text to web page
    d3.select("#hash-to-text-container").append("p").text(text);
}

function getGasPriceNow() {
    `
    Adds current gas price to webpage on load
    `
    web3.eth.getGasPrice().then(gasPriceWei => {
        let gasPrice = web3.utils.fromWei(gasPriceWei, "gwei");
        d3.select("#gas-price").text(gasPrice)});
}

function getBlockNumberNow() {
    `
    Adds current block number to website on load
    `
    web3.eth.getBlockNumber().then(num => {
        d3.select("#block-number").text(num);
    })
}

// ################################ End Definitions ################################

// Event handlers
addressInput = d3.select("#wallet-address");
contractInput = d3.select("#contract-address");
blockButton = d3.select("#block-button");
removeBlockButton = d3.select("#block-remove-button");
hashTestInput = d3.select("#hash-test");
hashFactoryInput = d3.select("#hash-factory");
hashToTextInput = d3.select("#hash-to-text");


addressInput.on("change", handleTextInputs);
addressInput.on("onsubmit", handleTextInputs);
contractInput.on("change", handleTextInputs);
contractInput.on("onsubmit", handleTextInputs);
blockButton.on("click", displayBlockInformation);
removeBlockButton.on("click", removeBlockInfo)
hashTestInput.on("change", isHash);
hashTestInput.on("onsubmit", isHash);
hashFactoryInput.on("change", textToHash);
hashFactoryInput.on("onsubmit", textToHash);
hashToTextInput.on("change", hashToText);
hashToTextInput.on("onsubmit", hashToText);

// Functions run at page load
getBlockNumberNow()
getGasPriceNow()

















// // Data collected from block 12601904
// var hash = "0x3e8f21b1b8f5692ff54fe15bd5a4ac36e041e7221917eeb068bd9ee2fb769df1";
// var extraData = "0xd883010a03846765746888676f312e31362e34856c696e7578";
// var miner = "0x5A0b54D5dc17e0AadC383d2db43B0a0D3E029c4c";
// var mixHash = "0x7d8ed2db39f2c6c38c1c60ab629e9ffecb3b2be1b6d1bd006bb21f41708aa715";
// var nonce = "0x3249f90004b28ef6";
// var parentHash = "0x504bc8bea809df6e1e6aeaf88b6c1bf435ead5658ae00a59a1301234c259abc5";
// var receiptsRoot = "0xe04dc21d87751dd4af0325a501393d4428b9117e74a934d1f7b2f776bc23bde2";
// var sha3Uncles = "0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347";
// var stateRoot = "0x3d56326d0d2eb90d9c05730f98f7ee2ceac3dd57a77016cf33476562529fa61c";
// var transaction = "0xdf0b86909938749e4fc11d11856844dd1dca898d09cd20c28be0eb583bda44bb";
// var transactionsRoot = "0xdb9f356532d8d8ab805063745a34766545729d3d817505c7b0d65c5fd777bb6b";


// let utf8 = web3.utils.hexToUtf8(transaction); // Works for: 
// console.log(utf8);

// let ascii = web3.utils.hexToAscii(transaction);
// console.log(ascii);

// let numberString = web3.utils.hexToNumberString(transaction); // Works for all
// console.log(numberString);

// let number = web3.utils.hexToNumber("0x39296"); // Data too big
// console.log(number);

