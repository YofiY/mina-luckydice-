import { AccountUpdate, Field, Mina, PrivateKey, UInt64 } from "o1js";
import { DiceRoll } from "./DiceRoll.js";

const useProofs = false;
const Local = await Mina.LocalBlockchain({proofsEnabled: useProofs})
Mina.setActiveInstance(Local);

const deployerAccount = Local.testAccounts[0];
const deployerKey = deployerAccount.key;

const playerA = Local.testAccounts[1];
const playerAKey = playerA.key;

const playerB = Local.testAccounts[2];
const playerBKey = playerB.key;

//const salt = Field.random();
const diceRollAppPrivateKey = PrivateKey.random();
const diceRollAppAddress = diceRollAppPrivateKey.toPublicKey();
const diceRollApp = new DiceRoll(diceRollAppAddress);


//Game Constants
const BET_SIZE = UInt64.from(100);
const PlayerAInput = Field(3)
const PlayerBInput = Field(14)

//deploy
const deployTxn = await Mina.transaction(deployerAccount, async () => {
    AccountUpdate.fundNewAccount(deployerAccount);
    await diceRollApp.deploy();
    await diceRollApp.initGame(playerA, playerB, BET_SIZE);
})
await deployTxn.prove();
await deployTxn.sign([deployerKey, diceRollAppPrivateKey])

console.log('deployed the program');