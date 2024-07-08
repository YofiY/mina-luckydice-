import { AccountUpdate, Field, Mina, PrivateKey, UInt64, PublicKey } from "o1js";
import { DiceRoll } from "./DiceRoll.js";
import { LocalBlockchain } from "o1js/dist/node/lib/mina/local-blockchain.js";

const useProofs = false;
const Local = await Mina.LocalBlockchain({ proofsEnabled: useProofs })
Mina.setActiveInstance(Local);

const deployerAccount = Local.testAccounts[0];
const deployerKey = deployerAccount.key;

const playerA = Local.testAccounts[1];
const playerAPrivateKey = playerA.key;

const playerB = Local.testAccounts[2];
const playerBPrivateKey = playerB.key;

//const salt = Field.random();
const diceRollAppPrivateKey = PrivateKey.random();
const diceRollAppAddress = diceRollAppPrivateKey.toPublicKey();
const diceRollApp = new DiceRoll(diceRollAppAddress);

const getPlayerBalance = (playerAddress: PublicKey) => Local.getAccount(playerAddress).balance.toString()
const printPlayersBalances = () => {
    console.log("  --> player A Balance : " + getPlayerBalance(playerA));
    console.log("  --> player B Balance : " + getPlayerBalance(playerB));
    console.log("  --> smart contract Balance: " + getPlayerBalance(diceRollAppAddress));
}


//Game Constants
const BET_SIZE = UInt64.from(100);
const PlayerAInput = Field(3)
const PlayerBInput = Field(14)

//deploy
const deployTxn = await Mina.transaction(deployerAccount, async () => {
    AccountUpdate.fundNewAccount(deployerAccount);
    await diceRollApp.deploy();
    await diceRollApp.initGame(playerA, playerB);
})
await deployTxn.prove();
await deployTxn.sign([deployerKey, diceRollAppPrivateKey]).send();
console.log('deployed the program');

printPlayersBalances();

//BetDeposit
const playerADepositTxn = await Mina.transaction(playerA, async () =>
    await diceRollApp.betDepositA(playerAPrivateKey)
)
await playerADepositTxn.prove();
await playerADepositTxn.sign([playerAPrivateKey]).send();
console.log('player A deposited 100 Mina bet');
printPlayersBalances();

const playerBDepositTxn = await Mina.transaction(playerB, async () =>
    await diceRollApp.betDepositB(playerBPrivateKey)
);
await playerBDepositTxn.prove();
await playerBDepositTxn.sign([playerBPrivateKey]).send();
console.log('player B deposited 100 Mina bet')
printPlayersBalances();