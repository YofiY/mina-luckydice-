import {
    Field,
    SmartContract,
    state,
    State,
    method,
    Poseidon,
    createForeignField,
    PublicKey,
    PrivateKey,
    Bool,
    AccountUpdate,
    UInt64,
} from 'o1js';

const NB_FACES = BigInt(6);

class DiceField extends createForeignField(NB_FACES) { }

export class DiceRoll extends SmartContract {
    @state(Field) playerA = State<PublicKey>();
    @state(Field) playerB = State<PublicKey>();

    @state(Field) diceRollA = State<DiceField>();
    @state(Field) diceRollB = State<DiceField>();

    @state(Field) inputA = State<Field>();
    @state(Field) inputB = State<Field>();

    @state(Field) betSize = State<UInt64>();

    init() {
        super.init();
    }

    @method async initGame(playerA: PublicKey, playerB: PublicKey, betSize: BigInt) {
        this.playerA.set(playerA);
        this.playerB.set(playerB);


        this.diceRollA.set(DiceField.from(0));
        this.diceRollB.set(DiceField.from(0));

        this.inputA.set(Field(0));
        this.inputB.set(Field(0));

        this.betSize.set(UInt64.from(0));
    }

    @method async betDepositA(privateKey: PrivateKey) {
        let playerAPublicKey = privateKey.toPublicKey();
        let betSize = this.betSize.get();
        this.playerA.requireEquals(playerAPublicKey);
        let playerAAccountUpdate = AccountUpdate.createSigned(playerAPublicKey);
        playerAAccountUpdate.send({ to: this, betSize });
    }

    @method async getInputA(inputA: Field, privateKey: PrivateKey) {
        this.playerA.requireEquals(privateKey.toPublicKey());
        this.inputA.requireEquals(Field(0))
        this.inputA.set(inputA);
        this.inputA.get().equals(0).not().assertEquals(true);
    }

    @method async getInputB(inputB: Field, privateKey: PrivateKey) {
        this.playerB.requireEquals(privateKey.toPublicKey())
        this.inputB.requireEquals(Field(0))
        this.inputB.set(inputB);
        this.inputB.get().equals(0).not().assertEquals(true);
    }

    @method async rollDice() {
        let inputA = this.inputA.get();
        this.inputA.requireEquals(inputA);
        inputA.equals(0).not().assertEquals(true);

        let inputB = this.inputA.get();
        this.inputB.requireEquals(inputB);
        inputB.equals(0).not().assertEquals(true);

        let randomSeedA = Poseidon.hash([inputA, inputB]);
        let randomSeedB = Poseidon.hash([randomSeedA]);

        this.diceRollA.set(DiceField.from(randomSeedA.toBigInt()));
        this.diceRollB.set(DiceField.from(randomSeedB.toBigInt()));
    }

    @method async settleGame() {

    }
}



