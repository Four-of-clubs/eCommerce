// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

/** 
 * @title Ballot
 * @dev Implements voting process along with vote delegation
 */

contract eCommerce {
    int public revenue = 0;
    string public ownerName;
    address public ownerAddress;
    int globalTransactionId = 0;

    struct product {
        uint productNo;
        string productName;
        int numItem;
        int unitCost;
        uint totalPurchases;
    }

    struct transaction {
        uint productNo;
        int numPurchased;
        address purchaser;
        bool isRefunded;
    }

    mapping(int => transaction) public transaction_map ;

    uint numProducts = 0;
    product [] public productArray;

    constructor (string memory arg_ownerName) {
        ownerName = arg_ownerName;
        ownerAddress = msg.sender;
    }

    function purchase(uint id, int amount) public payable{
        uint totalCost = uint(amount * productArray[id].unitCost);

        require(id<=numProducts, "Item Does Not Exist");
        require(productArray[id].numItem > amount, "Not Enough Stock");
        require(msg.value >= totalCost, "not enough Wei");

        productArray[id].numItem-= amount;
        productArray[id].totalPurchases+= uint(amount);
        revenue += productArray[id].unitCost * amount;
        sendEther(totalCost, ownerAddress);
        //add to transaction map
        transaction_map[globalTransactionId++] = transaction(id, amount, msg.sender, false);
    }

    function productRefund(int transactionCode) public payable{
        int amount = transaction_map[transactionCode].numPurchased;
        uint id = transaction_map[transactionCode].productNo;
        address recipientAddress = transaction_map[transactionCode].purchaser;

        uint totalCost = uint(amount * productArray[id].unitCost);

        require(transaction_map[transactionCode].isRefunded == false, "Has already been refunded");
        require(msg.sender == ownerAddress, "Can only be called by Owner");
        require(msg.value >= totalCost, "not enough Wei");

        productArray[id].numItem+= amount;
        productArray[id].totalPurchases-= uint(amount);
        revenue -= productArray[id].unitCost * amount;
        sendEther(totalCost, recipientAddress);

        transaction_map[transactionCode].isRefunded = true;
    }

    //should make sure only owner can add Product
    function addProduct(string memory arg_productName, int arg_numItem, int arg_unitCost) public {
        require(msg.sender == ownerAddress, "Can only be called by Owner");
        uint id = numProducts++;
        product memory newProduct;
        newProduct = product(id, arg_productName, arg_numItem, arg_unitCost, 0);
        productArray.push(newProduct);

    }

    function addItem(uint id, int numAdd) public {
        require(msg.sender == ownerAddress, "Can only be called by Owner");
        productArray[id].numItem+=numAdd;
    }

    function changePrice(uint id, int numAdd) public {
        require(msg.sender == ownerAddress, "Can only be called by Owner");
        productArray[id].unitCost+=numAdd;
    }

    function sendEther(uint payment, address recipient) public payable returns (bool, bytes memory){
        bool success;
        bytes memory data;
        (success, data) = recipient.call{value: payment}("");
        return (success, data);
    }

    function mostPopularProduct() public view returns(uint, uint) {
        uint bestProductID;
        uint bestProductPopularity = 0;
        for(uint i = 0; i<numProducts; i++){
            uint thisProductPopularity = productArray[i].totalPurchases;
            if (thisProductPopularity>bestProductPopularity){
                bestProductID = i;
                bestProductPopularity = thisProductPopularity;
            }
        }

        return (bestProductID, bestProductPopularity);
    }

}