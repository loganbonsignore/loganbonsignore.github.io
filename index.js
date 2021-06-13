// Etherscan API key
const etherscan_api_key = "6AMB9PGBYJ5AHHCZHCCZAU5Y7E4KEVET47"

// Instanciating Web3 object
var web3 = new Web3(Web3.givenProvider || new Web3.providers.WebsocketProvider('wss://mainnet.infura.io/v3/58ea22f2caa14187bd2b8c0682c84848:8546'));

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