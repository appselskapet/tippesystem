
class Match {
    constructor(id, h = false, u = false, b = false) {
        this.id = id;
        this.state = [h, u, b];
    }
}

class TippingSystem {
    constructor(matchCount = 12, setCount = 10) {
        this.setCount = setCount;
        this.matchSets = [];
        this.emptyRows = [];
        for (let set = 0; set < setCount; set++) {
            var matches = [];
            for (let matchId = 0; matchId < matchCount; matchId++) {
                matches.push(new Match(matchId));
                if (set === 0) {this.emptyRows.push(matchId)};
            }
            this.matchSets.push(matches);
        }
        this.systemRowsRaw = ["1x2 1x2 1x2",
            "21x x21 1x2",
            "x21 21x 1x2",
            "111 xxx 222"]

        this.systemRows = this.systemRowsRaw.map(row => {
            const parsedRow = [...row].filter(c => c !== " ").map(c => {
                switch (c) {
                    case '1':
                        return [true, false, false]
                    case 'x':
                        return [false, true, false]
                    case '2':
                        return [false, false, true]
                    default:
                        break;
                }
            });
            return parsedRow;
        });
    }

    setMatch(matchNumber, state) {
        this.matchSets[0][matchNumber].state = state;
    }

    applySystemToEmptyRows(rowNumber) {
        this.emptyRows.sort((a, b) => a > b);
        let subsetEmptyRows = this.emptyRows.length>4?this.emptyRows.slice(0, 4):this.emptyRows;
        console.log(subsetEmptyRows);
        subsetEmptyRows.forEach((row, emptyRowIndex) => {
            for (let set = 0; set < this.setCount - 1; set++) {
                this.matchSets[set + 1][row].state = this.systemRows[emptyRowIndex][set];
            }
        });

        if (this.emptyRows.length > 4) {
            for (let set = 1; set < this.setCount; set++) {
                this.matchSets[set][rowNumber].state = [false, false, false];
            }
        }
    }

    applySystemToFilledRows(rowNumber) {
        if (this.matchSets[0][rowNumber].state.every(s => !s)){return;}

        if (this.matchSets[0][rowNumber].state.every(s => s)) {
            let states = [[true, false, false], [false, true, false], [false, false, true]]

            this.matchSets.forEach((set, index) => {
                if (index == 0) { return; }
                set[rowNumber].state = states[(index - 1) % 3];
            });
        } else {
            let stateOfSet0 = this.matchSets[0][rowNumber].state;
            this.matchSets.forEach((set, index) => {
                if (index == 0) { return; }
                set[rowNumber].state = stateOfSet0;
            });
        }
    }

    rowIsEmpty(rowNumber) {
        return this.matchSets[0][rowNumber].state.every(s => !s)
    }

    updateSystem(rowNumber) {       
        this.rowIsEmpty(rowNumber) ? this.emptyRows.push(rowNumber) : this.emptyRows = this.emptyRows.filter(item => item !== (rowNumber));
        this.applySystemToEmptyRows(rowNumber);
        this.applySystemToFilledRows(rowNumber);
    }

    getSystemMatchSets(rowIndex) {
        let rowOfMatchSets = [];
        this.matchSets.forEach((element, index) => {
            if (index == 0) { return; }
            element[rowIndex].state.forEach(e => rowOfMatchSets.push(e));

        });
        return rowOfMatchSets;
    }
}

class TippingTable {
    constructor(tippingSystemModel) {
        this.tippingSystemModel = tippingSystemModel;
        var systemTipping = document.getElementById("table-systemtipping");
        systemTipping.appendChild(this.generateHeaders());
        systemTipping.appendChild(this.generateBody());
    }

    generateHeaders() {
        let systemTippingTHead = document.createElement("thead");
        let thKampNummer = document.createElement("th");
        thKampNummer.innerHTML = "#";
        systemTippingTHead.appendChild(thKampNummer);
        for (let index = 0; index < 10; index++) {
            this.makeMatchHeaders(index === 0 ? true : false, systemTippingTHead);
        };
        return systemTippingTHead;
    }

    makeMatchHeaders(main, row) {
        ["H", "U", "B"].forEach(element => {
            let th = document.createElement("th");
            th.classList.add(element.toLowerCase() + "cell");
            th.setAttribute("scope", "col");
            th.innerHTML = element;
            if (main) { th.classList.add("main") };
            row.appendChild(th);
        });
    }

    generateBody() {
        let systemTippingTBody = document.createElement("tbody");
        let headerText = 1;
        for (let row = 0; row < 12; row++) {
            const tr = document.createElement("tr");
            const th = document.createElement("th");
            th.setAttribute("scope", "row");
            th.innerHTML = headerText;
            headerText = headerText + 1;

            tr.appendChild(th);

            for (let col = 0; col < 10; col++) {
                this.makeMatchCells(col === 0 ? true : false, tr);
            };

            systemTippingTBody.appendChild(tr);
        }
        return systemTippingTBody;
    }

    updateTable(row, matchState) {
        this.tippingSystemModel.setMatch(row.rowIndex, matchState);
        this.tippingSystemModel.updateSystem(row.rowIndex);
        for (const oneRow of row.parentNode.children) {
            let systemMatchSets = this.tippingSystemModel.getSystemMatchSets(oneRow.rowIndex);
            for (let i = 4; i < oneRow.cells.length; i++) {
                oneRow.cells[i].innerHTML = systemMatchSets[i - 4] ? "X" : "";
            }            
        }
    }

    updateProgressBar() {
        let numberOfEmptyRows = this.tippingSystemModel.emptyRows.length;
        let targetNumberFilledRows = 8;
        let currentFilledRows = 12-numberOfEmptyRows;
        var progressBar = document.getElementById("system-progress");
        progressBar.setAttribute("aria-valuenow", currentFilledRows / targetNumberFilledRows);
        progressBar.style.width = (currentFilledRows / targetNumberFilledRows)*100 + "%";
        progressBar.innerHTML = currentFilledRows + "/" + targetNumberFilledRows;
        progressBar.classList.toggle("bg-success", (currentFilledRows === targetNumberFilledRows))
        progressBar.classList.toggle("bg-warning", (currentFilledRows > targetNumberFilledRows))
    }

    makeMatchCells(main, row) {
        ["H", "U", "B"].forEach(element => {
            let td = document.createElement("td");
            td.classList.add(element.toLowerCase() + "cell");
            if (main) {
                td.classList.add("main");
                td.onclick = (e) => {
                    let currentRow = e.target.parentNode;
                    e.target.innerHTML === "X" ? e.target.innerHTML = "" : e.target.innerHTML = "X";

                    const matchState = [e.target.parentNode.children[1].innerHTML,
                    e.target.parentNode.children[2].innerHTML,
                    e.target.parentNode.children[3].innerHTML].map(state => { return state === "X" });
                    this.updateTable(currentRow, matchState);
                    this.updateProgressBar();
                }
            };
            row.appendChild(td);
        });
    }



}

function generateHeaders() {
    let systemTippingTHead = document.createElement("thead");
    let thKampNummer = document.createElement("th");
    thKampNummer.innerHTML = "#";
    systemTippingTHead.appendChild(thKampNummer);
    for (let index = 0; index < 9; index++) {
        makeMatchHeaders(index === 0 ? true : false, systemTippingTHead);
    };
    return systemTippingTHead;
}

function makeMatchHeaders(main, row) {
    ["H", "U", "B"].forEach(element => {
        let th = document.createElement("th");
        th.classList.add(element.toLowerCase() + "cell");
        th.setAttribute("scope", "col");
        th.innerHTML = element;
        if (main) { th.classList.add("main") };
        row.appendChild(th);
    });
}

function generateBody() {
    let systemTippingTBody = document.createElement("tbody");
    let headerText = 1;
    for (let row = 0; row < 12; row++) {
        const tr = document.createElement("tr");
        const th = document.createElement("th");
        th.setAttribute("scope", "row");
        th.innerHTML = headerText;
        headerText = headerText + 1;

        tr.appendChild(th);

        for (let col = 0; col < 9; col++) {
            makeMatchCells(col === 0 ? true : false, tr);
        };

        systemTippingTBody.appendChild(tr);
    }
    return systemTippingTBody;
}

var tippingSystemModel = new TippingSystem();
console.log(tippingSystemModel);
var tippingSystemTable = new TippingTable(tippingSystemModel);
