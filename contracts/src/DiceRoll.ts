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
    UInt8,
    Int64,
    UInt32,
    Provable,
    Gadgets,
    Circuit,
} from 'o1js';

const divMod6 = (b: Field) => {
    let x = b;
    let y_ = Field(6);

    if (x.isConstant() && y_.isConstant()) {
        let xn = x.toBigInt();
        let yn = y_.toBigInt();
        let q = xn / yn;
        let r = xn - q * yn;
        return {
            quotient: new UInt32(new Field(q.toString()).value),
            rest: new UInt32(new Field(r.toString()).value),
        };
    }

    y_ = y_.seal();

    let q = Provable.witness(
        Field,
        () => new Field(x.toBigInt() / y_.toBigInt())
    );

    Gadgets.rangeCheck32(q);

    // TODO: Could be a bit more efficient
    let r = x.sub(q.mul(y_)).seal();
    Gadgets.rangeCheck32(r);

    let r_ = new UInt32(r.value);
    let q_ = new UInt32(q.value);

    r_.assertLessThan(new UInt32(y_.value));

    return { quotient: q_, rest: r_ };
};

const mod6 = (a: Field) => {
    return divMod6(a).rest.value;
};

export class DiceRoll extends SmartContract {
    @state(Field) playerA = State<PublicKey>();
    @state(Field) playerB = State<PublicKey>();

    @state(Field) diceRollA = State<Field>();
    @state(Field) diceRollB = State<Field>();

    @state(Field) inputA = State<Field>();
    @state(Field) inputB = State<Field>();

    @state(Field) betSize = State<UInt64>();

    init() {
        super.init();
    }

    @method async initGame(playerA: PublicKey, playerB: PublicKey, betSize: UInt64) {
        this.playerA.set(playerA);
        this.playerB.set(playerB);

        this.diceRollA.set(Field(0));
        this.diceRollB.set(Field(0));

        this.inputA.set(Field(0));
        this.inputB.set(Field(0));

        this.betSize.set(betSize);
    }

    @method async betDepositA(privateKey: PrivateKey) {
        let playerAPublicKey = privateKey.toPublicKey();
        let betSize = this.betSize.get();
        this.playerA.requireEquals(playerAPublicKey);
        let playerAAccountUpdate = AccountUpdate.createSigned(playerAPublicKey);
        playerAAccountUpdate.send({ to: this, amount: new UInt64(betSize) });
    }

    @method async betDepositB(privateKey: PrivateKey) {
        let playerBPublicKey = privateKey.toPublicKey();
        let betSize = this.betSize.get();
        this.playerA.requireEquals(playerBPublicKey);
        let playerAAccountUpdate = AccountUpdate.createSigned(playerBPublicKey);
        playerAAccountUpdate.send({ to: this, amount: betSize });
    }

    @method

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

        this.diceRollA.set(mod6(randomSeedA));
        this.diceRollB.set(mod6(randomSeedB));
    }

    @method async settleGame() {
        let diceRollA = this.diceRollA.get();
        let diceRollB = this.diceRollB.get();
    
        let playerA = this.playerA.get();
        let playerB = this.playerB.get();
    
        const playerKey = this.sender.getAndRequireSignature();
    
        const isPlayerA = playerA.equals(playerKey);
        const isPlayerB = playerB.equals(playerKey);
        isPlayerA.or(isPlayerB).assertTrue('Unknown player key');
    
        // calculate bounty
    
        const playerABountySelector = Provable.switch(
          [
            diceRollA.equals(diceRollB),
            diceRollA.greaterThan(diceRollB),
            diceRollA.lessThan(diceRollB),
          ],
          Field,
          [Field(0), Field(1), Field(2)]
        );
    
        const playerBBountySelector = Provable.switch(
          [
            diceRollA.equals(diceRollB),
            diceRollB.greaterThan(diceRollA),
            diceRollB.lessThan(diceRollA),
          ],
          Field,
          [Field(0), Field(1), Field(2)]
        );
    
        const betSize = this.betSize.getAndRequireEquals();
        const payoutAmountA = Provable.switch(
          [
            playerABountySelector.equals(0),
            playerABountySelector.equals(1),
            playerABountySelector.equals(2),
          ],
          UInt64,
          [betSize, betSize.mul(2), UInt64.from(0)]
        );
    
        const payoutAmountB = Provable.switch(
          [
            playerBBountySelector.equals(0),
            playerBBountySelector.equals(1),
            playerBBountySelector.equals(2),
          ],
          UInt64,
          [betSize, betSize.mul(2), UInt64.from(0)]
        );
    
        const finalOutAmount = Provable.if(isPlayerA, payoutAmountA, payoutAmountB);
    
        const zeroKey = PublicKey.empty();
    
        this.playerA.set(Provable.if(isPlayerA, zeroKey, this.playerA.get()));
        this.playerB.set(Provable.if(isPlayerB, zeroKey, this.playerB.get()));
    
        this.send({
          to: playerKey,
          amount: finalOutAmount,
        });
      }




}



