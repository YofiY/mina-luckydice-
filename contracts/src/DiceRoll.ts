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

    @state(Field) betSize = State<BigInt>();

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

        this.betSize.set(betSize);
    }

    @method async placeBetA(privateKey:PrivateKey) {
       this.account.provedState.requireEquals(Bool(true));
       this.playerA.requireEquals(privateKey.toPublicKey());
       let accountUpdate = AccountUpdate.create(privateKey.toPublicKey());
       accountUpdate.account.isNew.requireEquals(Bool(true));
       accountUpdate.account.balance.get().assertGreaterThanOrEqual();
    }

    @method async getInputA(inputA: Field, privateKey: PrivateKey) {
        this.playerA.requireEquals(privateKey.toPublicKey());
        this.inputA.requireEquals(Field(0))
        this.inputA.set(inputA);
        this.inputA.get().inv()
    }

    @method async getInputB(inputB: Field, privateKey: PrivateKey) {
        this.playerB.requireEquals(privateKey.toPublicKey())
        this.inputB.requireEquals(Field(0))
        this.inputB.set(inputB);
        this.inputA.get().inv();
    }

    @method async rollDice() {
        let inputA = this.inputA.get();
        this.inputA.requireEquals(inputA);
        inputA.assertNotEquals(0);
        inputA.equals(0).not().assertEquals(true

        )
        inputA.assertGreaterThan(0);

        let inputB = this.inputA.get();
        this.inputB.requireEquals(inputB);
        inputB.inv();

        let randomSeedA = Poseidon.hash([inputA, inputB]);
        let randomSeedB = Poseidon.hash([randomSeedA]);

        this.diceRollA.set(DiceField.from(randomSeedA.toBigInt()));
        this.diceRollB.set(DiceField.from(randomSeedB.toBigInt()));
    }

    @method async settleGame() {

    }
}



