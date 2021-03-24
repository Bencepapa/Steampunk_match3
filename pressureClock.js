

var pressureClock = function (game) {
    this.game = game;
};
pressureClock.prototype = {
    clock: null,
    clockhandle: null,
    valve: null,
    valveemitter: null,
    clocktween: null,
    handletween: null,
    minhandleangle: -30 - 90,
    maxhandleangle: -30 - 90 + 240,
    pressure: 50,
    init: function () {

        var clock = this.game.add.sprite(130, 130, "eclock");
        clock.anchor.set(0.5);
        this.clock = clock;

        var clockhandle;
        clockhandle = this.game.add.sprite(0, 0, "epointer");
        clockhandle.anchor.set(0.5, 0.89);
        clockhandle.scale.set(0.25, 0.25);
        clockhandle.angle = this.minhandleangle;
        this.clockhandle = clockhandle;
        this.clock.addChild(this.clockhandle)
        this.setPressure(50);

        var valve = this.game.add.sprite(0,0 + clock.height / 2 - 18, "valve");
        this.valve = valve;
        valve.anchor.set(0.15, 0.5);
        this.clock.addChild(this.valve)

        var valveemitter = this.game.add.emitter(0, 0, 500);
        this.valveemitter = valveemitter;
        valveemitter.makeParticles(['fogs'], [1, 2, 3]);
        valveemitter.gravity = -200;
        valveemitter.setXSpeed(400, 100);
        valveemitter.setYSpeed(-10, 10);
        valveemitter.setAlpha(1.0, 0.1, 3000) //, Phaser.Easing.Cubic.In);
        valveemitter.setScale(0.2, 2.0, 0.2, 2.0, 3000);
        this.valve.addChild(this.valveemitter)

    },
    resize: function () {

    },
    calcClockHandleRotation: function () {
        return this.minhandleangle +
            (this.maxhandleangle - this.minhandleangle) * this.pressure / 200;
    },
    animateHandle: function () {
        //this.handletween = this.game.add.tween(this.clockhandle).to({ angle: this.calcClockHandleRotation() },
        //    1000, Phaser.Easing.Cubic.InOut, true);
        //console.log(this.calcClockHandleRotation(), this.clockhandle.angle);
        this.clockhandle.angle += (this.calcClockHandleRotation() - this.clockhandle.angle) / 30;
        if (this.clockhandle.angle > this.maxhandleangle)
            this.clockhandle.angle = this.maxhandleangle;
    },
    setPressure: function (pressure) {
        this.pressure = pressure;
        this.boundPressure();
        this.animateHandle();
    },
    tooHighPressure: function () {
        return (this.pressure >= 150);
    },
    boundPressure: function () {
        if (this.pressure > 500) this.pressure = 500;
        if (this.pressure < 0) this.pressure = 0;
    },
    addPressure: function (amount) {
        this.pressure += amount;
        if (this.tooHighPressure()) {
            if (!this.clocktween) {
                console.log("toohighpressure!");
                this.clocktween = this.game.add.tween(this.clock.scale)
                    .to({ x: 1.05, y: 1.05 },
                    300, Phaser.Easing.Back.InOut, true, 0, -1, true);
            }
        }
        else if (this.clocktween) {
            this.clocktween.stop();
            this.clocktween = null;
            this.clock.scale.setTo(1.0);
        }
        this.boundPressure();
        this.animateHandle();

    },
    emit: function (amount) {
        this.valveemitter.x = this.valve.width * 0.8;
        this.valveemitter.y = 0;
        this.valveemitter.flow(1500, 500 / amount, 3, amount * 10);
    }
}