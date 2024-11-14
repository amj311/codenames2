export default class Team {
    constructor(id, name, color, isCompetitor, qty = 0) {
        this.id = id;
        this.name = name;
        this.color = color;
        this.isCompetitor = isCompetitor;
        this.pts = 0;
        this.qty = qty;
        this.captainId = null;
    }

    resetPoints() {
        this.pts = 0;
    }

    addPoint() {
        this.pts++;
    }
}
