import { TimeRegister } from './timeRegister.js';
const EncounterTablePrefix = "Encounter";
/// Registra um encntro na cena atual
export class Encounters {
    async RegistryEncounter(minutes, tableName) {
        const regEncounters = new TimeRegister('Encounters');
        regEncounters.RegisterScene(minutes, (() => {
            let encounter = new Encounters();
            encounter.RollTable(tableName);
        }));
    }
    async RollTable(tableName) {
        $(`.roll-type-select select`).val(`gmroll`).change();

        this.tableName = await this.FindTableRoll(tableName);
        if (!this.tableName) {
            tableName = await this.SetNameRollTableByTime(tableName);
            this.tableName = await this.FindTableRoll(tableName);
            if (!this.tableName) return ui.notifications.error("Não existe tabela de encontro para este mapa: " + tableName);
        }
        await game.betterTables.betterTableRoll(this.tableName);
        await $(`.roll-type-select select`).val(`roll`).change();
    }
    async FindTableRoll(tableName, rollTableEncounterPack = `mod-my-world.tables-encounter`) {
        tableName = tableName || `${EncounterTablePrefix} ${game.scenes.active.name}`;
        let table;
        try {
            table = await game.tables.entities.find(t => t.name === tableName);
            if (!table) {
                const pack = await game.packs.get(rollTableEncounterPack);
                let entry = await pack.index.find(a => a.name === tableName);
                table = await pack.getEntity(entry._id);
            }
        } catch (e) { }     
        return table;
    }
    SetNameRollTableByTime(tableName) {
        let hour = game.Gametime.DTNow().hours;
        tableName += (hour >= 19 || hour < 7) ? " Night" : " Day";
        return tableName;
    }
}