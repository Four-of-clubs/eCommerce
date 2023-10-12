const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');

const web3 = new Web3(ganache.provider());
const {abi, bytecode} = require('../compile');

let accounts;
let eCommerce_instance;

describe("eCommerce test 1 - deploys and product creation ", () => {
    
    beforeEach(async () => {
        // Get a list of all accounts
        accounts = await web3.eth.getAccounts();
        
        eCommerce_instance = await new web3.eth.Contract(abi)
        .deploy({
        data: bytecode,
        arguments: ["Contract Owner Name"],
        })
        .send({ from: accounts[0], gasPrice: 8000000000, gas: 4700000});
        
        });

    it("deploys", async () => {
        console.log(accounts);
        assert.ok(eCommerce_instance.options.address)
        const ownerName = await eCommerce_instance.methods.ownerName().call();
        const ownerAddress = await eCommerce_instance.methods.ownerAddress().call();
        assert.equal(ownerName, "Contract Owner Name");
        assert.equal(ownerAddress, accounts[0]);
    });

    it("test create product - succeed", async () => {
        await eCommerce_instance.methods.addProduct("Cat", 20, 60).send({ from: accounts[0], gasPrice: 8000000000, gas: 4700000});
        const product1 = await eCommerce_instance.methods.productArray(0).call();
        assert.equal(product1.productName, "Cat");
        assert.equal(product1.numItem, 20);
        assert.equal(product1.unitCost, 60);

        await eCommerce_instance.methods.addProduct("Fish", 40, 10).send({ from: accounts[0], gasPrice: 8000000000, gas: 4700000});
        const product2 = await eCommerce_instance.methods.productArray(1).call();
        assert.equal(product1.productName, "Cat");
        assert.equal(product1.numItem, 20);
        assert.equal(product1.unitCost, 60);

        assert.equal(product2.productName, "Fish");
        assert.equal(product2.numItem, 40);
        assert.equal(product2.unitCost, 10);

    });

    it("test create product with a non-owner account", async () => {
        // Attempt to create a product with a different account (accounts[1])
        try {
            await eCommerce_instance.methods.addProduct("Dog", 30, 40).send({ from: accounts[1], gasPrice: 8000000000, gas: 4700000 });
            // If the transaction succeeds, the test should fail
            assert.fail("Transaction should have thrown an error");
        } catch (error) {
            // Check if the error message contains the expected "revert" message
            assert(error.message.includes("revert"), "Expected 'revert' error message");
        }
        
    });
});

/*
purchase
productRefund
addItem
changePrice
mostPopularProduct
*/

describe("eCommerce test 2 - addItem, ChangePrice, purchase, refund, mostPopular", () => {
    
    beforeEach(async () => {
        // Get a list of all accounts
        accounts = await web3.eth.getAccounts();
        
        eCommerce_instance = await new web3.eth.Contract(abi)
        .deploy({
        data: bytecode,
        arguments: ["Contract Owner Name"],
        })
        .send({ from: accounts[0], gasPrice: 8000000000, gas: 4700000});
        await eCommerce_instance.methods.addProduct("Cat", 20, 60).send({ from: accounts[0], gasPrice: 8000000000, gas: 4700000});
        await eCommerce_instance.methods.addProduct("Fish", 40, 10).send({ from: accounts[0], gasPrice: 8000000000, gas: 4700000});
        await eCommerce_instance.methods.addProduct("Dog", 16, 65).send({ from: accounts[0], gasPrice: 8000000000, gas: 4700000});
        });

        it("test add item", async () => {
            await eCommerce_instance.methods.addItem(0, 5).send({
                from: accounts[0], // Use an account other than the owner (accounts[0])
                gasPrice: 8000000000,
                gas: 4700000
            });
            const numCats = (await eCommerce_instance.methods.productArray(0).call()).numItem;
            assert.equal(numCats, 25);
        });

        it("test change price", async () => {
            await eCommerce_instance.methods.changePrice(0, -5).send({
                from: accounts[0], // Use an account other than the owner (accounts[0])
                gasPrice: 8000000000,
                gas: 4700000
            });
            const catsPrice = (await eCommerce_instance.methods.productArray(0).call()).unitCost;
            assert.equal(catsPrice, 55);
        })

        it("test purchase", async () => {
            // Get the owner's initial balance
            const ownerInitialBalance = BigInt(await web3.eth.getBalance(accounts[0]));
        
            // Make a purchase
            await eCommerce_instance.methods.purchase(0, 5).send({
                from: accounts[1], // Use an account other than the owner (accounts[0])
                value: 5 * 60, // Send enough Ether to cover the purchase
                gasPrice: 8000000000,
                gas: 4700000
            });
        
            const updatedNumItem = (await eCommerce_instance.methods.productArray(0).call()).numItem;
        
            const ownerUpdatedBalance = BigInt(await web3.eth.getBalance(accounts[0]));
        
            // Convert expected balance to BigInt
            const expectedOwnerBalance = ownerInitialBalance + BigInt(5 * 60);
        
            // Assert that the purchase was successful
            assert.equal(updatedNumItem, 15, "Number of items in stock should decrease after purchase");
        
            // Assert that the owner gained the correct funds
            assert.equal(ownerUpdatedBalance.toString(), expectedOwnerBalance.toString(), "Owner's balance should increase by the purchase amount");
        });

        it("test most popular product", async() => {
            await eCommerce_instance.methods.purchase(0, 5).send({
                from: accounts[1], // Use an account other than the owner (accounts[0])
                value: 5 * 60, // Send enough Ether to cover the purchase
                gasPrice: 8000000000,
                gas: 4700000
            });


            await eCommerce_instance.methods.purchase(0, 5).send({
                from: accounts[1], // Use an account other than the owner (accounts[0])
                value: 5 * 60, // Send enough Ether to cover the purchase
                gasPrice: 8000000000,
                gas: 4700000
            });

            await eCommerce_instance.methods.purchase(0, 5).send({
                from: accounts[1], // Use an account other than the owner (accounts[0])
                value: 5 * 60, // Send enough Ether to cover the purchase
                gasPrice: 8000000000,
                gas: 4700000
            });


            await eCommerce_instance.methods.purchase(1, 5).send({
                from: accounts[1], // Use an account other than the owner (accounts[0])
                value: 5 * 10, // Send enough Ether to cover the purchase
                gasPrice: 8000000000,
                gas: 4700000
            });
            
            

            const mostPopular = await eCommerce_instance.methods.mostPopularProduct().call({
                from: accounts[0],
                gasPrice: 8000000000,
                gas: 4700000
            });
            
            assert.equal(mostPopular[0], 0);
            assert.equal(mostPopular[1], 15);
            
        })

        it("test return", async () => {
        
            await eCommerce_instance.methods.purchase(0, 5).send({
                from: accounts[1],
                value: 5 * 60,
                gasPrice: 8000000000,
                gas: 4700000,
            });
        
            await eCommerce_instance.methods.purchase(0, 5).send({
                from: accounts[1],
                value: 5 * 60,
                gasPrice: 8000000000,
                gas: 4700000,
            });
        
            await eCommerce_instance.methods.purchase(0, 5).send({
                from: accounts[1],
                value: 5 * 60,
                gasPrice: 8000000000,
                gas: 4700000,
            });

            const initialBalance = await web3.eth.getBalance(accounts[1]);
        
            await eCommerce_instance.methods.productRefund(0).send({
                from: accounts[0],
                value: 5 * 60,
                gasPrice: 8000000000,
                gas: 4700000,
            });
        
            // Capture the updated balance of account[1]
            const updatedBalance = await web3.eth.getBalance(accounts[1]);
        
            // Convert the balance values to BigNumbers for accurate comparison
            const initialBalanceBN = web3.utils.toBN(initialBalance);
            const updatedBalanceBN = web3.utils.toBN(updatedBalance);
        
            // Assert that the updated balance is greater than the initial balance
            assert(updatedBalanceBN.gt(initialBalanceBN));
        
            const product0 = await eCommerce_instance.methods.productArray(0).call();
            assert.equal(product0.numItem, 10);
            assert.equal(product0.totalPurchases, 10);
        });
        
});