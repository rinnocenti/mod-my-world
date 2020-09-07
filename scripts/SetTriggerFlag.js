const SCOPE_FLAG = 'worldTrigger';
export class SetTriggerFlag {
    // Name.perToken.once
    // Name.perUser.each
    // Name.perScene
    constructor(userid, tokenid, flagName, range, trigger) {
        this.userid = userid;
        this.tokenid = tokenid;
        this.flagTrigger = (trigger !== undefined && trigger !== false) ? true : false;
        this.flagRange = range || 'perToken';
        this.flagName = flagName;
        this.dataFlag = (this.flagRange === 'perScene') ? game.scenes.active : (this.flagRange === 'perUser') ? game.users.get(this.userid) : canvas.tokens.get(this.tokenid);
    }

    async SetFlag(flagName) {
        flagName = flagName || this.flagName;
        if (game.user.isGM === true)
            this.dataFlag.setFlag(`world`, `${SCOPE_FLAG}.${flagName}`, true);
        else
            game.macros.entities.find(i => i.name === 'GMSetFlag').execute(this.userid, this.tokenid, this.flagName, this.flagRange, this.flagTrigger);
    }
    async ResetFlag(flagName) {
        flagName = flagName || this.flagName;
        if (game.user.isGM === true) {
            try {
                this.dataFlag.unsetFlag(`world`, `${SCOPE_FLAG}.-=${flagName}`);
            } catch (e) { }
        } else {
            game.macros.entities.find(i => i.name === 'GMResetFlag').execute(this.userid, this.tokenid, this.flagName, this.flagRange, this.flagTrigger);
        }
    }
    async ResetAllFlag(flagName) {
        flagName = flagName || this.flagName;
        let dataFlag = (this.flagRange === 'perScene') ? game.scenes.active : (this.flagRange === 'perUser') ? game.users : canvas.tokens.placeables;
        if (game.user.isGM === true) {
            for (let flag of dataFlag) {
                if (flag.getFlag(`world`, `${SCOPE_FLAG}.${flagName}`)) {
                    flag.unsetFlag(`world`, `${SCOPE_FLAG}.-=${flagName}`);
                }
            }
        } else
            game.macros.entities.find(i => i.name === 'GMResetFlag').execute(this.userid, this.tokenid, this.flagName, this.flagRange, this.flagTrigger);
    }
    // todas as checagens sem um range e um trigger vai checar todos os tokens em busca da flag se achar não executa.
    GetFlag(flagName) {
        flagName = flagName || this.flagName;
        if (this.flagTrigger) {
            let dataFlag = (this.flagRange === 'perScene') ? game.scenes.active : (this.flagRange === 'perUser') ? game.users : canvas.tokens.placeables;
            for (let flag of dataFlag) {
                let activated = flag.getFlag(`world`, `${SCOPE_FLAG}.${flagName}`) || false;
                if (activated !== false) return activated;
            }
        } else {
            return this.dataFlag.getFlag(`world`, `${SCOPE_FLAG}.${flagName}`) || false;
        }
    }
}