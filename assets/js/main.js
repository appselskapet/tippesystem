
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
        this.emptyRows = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
        this.deliveredCoupons = [];
        for (let set = 0; set < setCount; set++) {
            var matches = [];
            for (let matchId = 0; matchId < matchCount; matchId++) {
                matches.push(new Match(matchId));
                if (set === 0) { this.emptyRows.push(matchId) };
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
        let firstEmptyRows = [];
        let lastEmptyRows = [];
        if (this.emptyRows.length > 4) {
            firstEmptyRows = this.emptyRows.slice(0, 4);
            lastEmptyRows = this.emptyRows.slice(5, this.emptyRows.length);
        } else {
            firstEmptyRows = this.emptyRows;
            lastEmptyRows = [];
        }

        this.emptyRows.forEach((row, emptyRowIndex) => {
            for (let set = 0; set < this.setCount - 1; set++) {
                if (emptyRowIndex < 4) {
                    this.matchSets[set + 1][row].state = this.systemRows[emptyRowIndex][set]
                } else {
                    this.matchSets[set + 1][row].state = [false, false, false];
                }
            }
        });
    }

    applySystemToFilledRows(rowNumber) {
        if (this.matchSets[0][rowNumber].state.every(s => !s)) { return; }

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

    storeSystem() {
        let storedSystem = { "matchSets": this.matchSets, "emptyRows": this.emptyRows, "deliveredCoupons": this.deliveredCoupons };
        localStorage.setItem("storedSystem", JSON.stringify(storedSystem));
    }

    setDeliveredCoupon(couponId, value) {
        if (value && !this.deliveredCoupons.includes(couponId)) {
            this.deliveredCoupons.push(couponId);            
        } else if (!value && this.deliveredCoupons.includes(couponId)) {
            this.deliveredCoupons.pop(couponId)
        }
        this.storeSystem();
    }

    getDeliveredCouponState(couponId) {
        return this.deliveredCoupons.includes(couponId);
    }

    updateSystem(rowNumber) {
        this.rowIsEmpty(rowNumber) ? this.emptyRows.push(rowNumber) : this.emptyRows = this.emptyRows.filter(item => item !== (rowNumber));
        this.applySystemToEmptyRows(rowNumber);
        this.applySystemToFilledRows(rowNumber);
        this.storeSystem();
    }

    getSystemMatchSets(rowIndex) {
        let rowOfMatchSets = [];
        this.matchSets.forEach((element, index) => {
            if (index == 0) { return; }
            element[rowIndex].state.forEach(e => rowOfMatchSets.push(e));

        });
        return rowOfMatchSets;
    }

    getAllMatchSetsExpanded() {
        let matchSetsExpanded = [];

        for (let matchNumber = 0; matchNumber < this.matchSets[9].length; matchNumber++) {
            let oneRow = [];
            for (let setNumber = 0; setNumber < this.matchSets.length; setNumber++) {
                oneRow.push(...this.matchSets[setNumber][matchNumber].state)
            }
            matchSetsExpanded.push(oneRow);
        }
        return matchSetsExpanded;
    }
}

class TippingTable {
    constructor(tippingSystemModel) {
        this.tippingSystemModel = tippingSystemModel;
        this.systemTippingTable = document.getElementById("table-systemtipping");
        this.systemTippingTable.appendChild(this.generateHeaders());
        this.systemTippingTable.appendChild(this.generateBody());
    }

    setDeliveredCoupon(model, couponId, value) {
        model.setDeliveredCoupon(couponId, value);
    }

    getDeliveredCouponState(model, couponId) {
        return model.getDeliveredCouponState(couponId);
    }

    makeCellWithCheckBox(couponNumber) {
        let cell = document.createElement("td");
        cell.colSpan = 3;
        let div = document.createElement("div");
        div.classList.add("btn-group-toggle");
        div.setAttribute("data-toggle", "buttons");
        let label = document.createElement("label");
        label.classList.add("btn", "btn-outline-success");
        label.id = couponNumber;
        let input = document.createElement("input");
        input.type = "checkbox";
        input.autocomplete = "off";
        input.onclick = (e) => {
            this.setDeliveredCoupon(this.tippingSystemModel, parseInt(e.target.parentNode.id), e.target.checked);
        }
        label.appendChild(input);
        div.appendChild(label);
        cell.appendChild(div);

        return cell;
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

            if (row !== 0 && row % 3 === 0) {
                tr.classList.add("fatline");
            }

            systemTippingTBody.appendChild(tr);
        }
        const checkBoxRow = document.createElement("tr");
        checkBoxRow.id = "check-box-row";
        const thCheckBox = document.createElement("th");
        thCheckBox.setAttribute("scope", "row");
        checkBoxRow.appendChild(thCheckBox);
        const tdSpacer = document.createElement("td");
        tdSpacer.colSpan = 3;
        checkBoxRow.appendChild(tdSpacer);
        for (let col = 0; col < 9; col++) {
            checkBoxRow.appendChild(this.makeCellWithCheckBox(col));
        };

        systemTippingTBody.appendChild(checkBoxRow);

        return systemTippingTBody;
    }

    updateTable(row, matchState) {
        this.tippingSystemModel.setMatch(row.rowIndex, matchState);
        this.tippingSystemModel.updateSystem(row.rowIndex);
        for (const oneRow of row.parentNode.children) {
            if (oneRow.rowIndex < 12) {
                let systemMatchSets = this.tippingSystemModel.getSystemMatchSets(oneRow.rowIndex);
                for (let i = 4; i < oneRow.cells.length; i++) {
                    oneRow.cells[i].innerHTML = systemMatchSets[i - 4] ? "X" : "";
                }
            }
        }
    }

    refreshTable() {
        let allMatchSets = this.tippingSystemModel.getAllMatchSetsExpanded();
        for (const oneRow of this.systemTippingTable.rows) {
            if (oneRow.rowIndex < 12) {
                let rowCells = oneRow.getElementsByTagName("td");
                for (let i = 0; i < rowCells.length; i++) {
                    rowCells[i].innerHTML = allMatchSets[oneRow.rowIndex][i] ? "X" : "";
                }
            }
        }
    }

    refreshDeliveredCouponCheckBoxes() {
        let allCheckBoxes = document.getElementById("check-box-row").getElementsByTagName("label");
        Array.from(allCheckBoxes).forEach((checkBox) => {

            let checkboxId = parseInt(checkBox.id);

            if (this.getDeliveredCouponState(this.tippingSystemModel, checkboxId)) {
                checkBox.classList.add("active");
                checkBox.firstChild.checked = true;
            } else {
                checkBox.classList.remove("active");
            }
        });
    }

    updateProgressBar() {
        let numberOfEmptyRows = this.tippingSystemModel.emptyRows.length;
        let targetNumberFilledRows = 8;
        let currentFilledRows = 12 - numberOfEmptyRows;
        let progressBar = document.getElementById("system-progress");
        progressBar.setAttribute("aria-valuenow", currentFilledRows / targetNumberFilledRows);
        progressBar.style.width = (currentFilledRows / targetNumberFilledRows) * 100 + "%";
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

window.addEventListener("load", onload);

var tippingSystem = new TippingSystem();
var tippingTable = new TippingTable(tippingSystem);

function onload() {
    var storedSystem = JSON.parse(localStorage.getItem("storedSystem"));

    if (storedSystem) {
        tippingTable.tippingSystemModel.emptyRows = storedSystem.emptyRows;
        tippingTable.tippingSystemModel.matchSets = storedSystem.matchSets;
        tippingTable.tippingSystemModel.deliveredCoupons = storedSystem.deliveredCoupons;
        tippingTable.refreshTable();
        tippingTable.updateProgressBar();
        tippingTable.refreshDeliveredCouponCheckBoxes();
    };

    $('#iframe-menu button').on("click", iframeNorskTippingNavigation);
    $('#system-buttons button').on("click", clearSystem);
};

const iframeNorskTippingNavigation = function () {
    document.getElementById('iframe-norsk-tipping').src = norskTippingLinks[this.id];
}

const norskTippingLinks = {
    "midweek": "https://www.norsk-tipping.no/sport/tipping/spill?day=3",
    "saturday": "https://www.norsk-tipping.no/sport/tipping/spill?day=1",
    "sunday": "https://www.norsk-tipping.no/sport/tipping/spill?day=2",
    "results": "https://www.norsk-tipping.no/sport/tipping/resultater"
};

function clearSystem() {
    console.log("clearing")
    tippingTable.tippingSystemModel.emptyRows = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    tippingTable.tippingSystemModel.matchSets.forEach((set) => {
        set.forEach((match) => {
            match.state = [false, false, false]
        })
    });
    tippingTable.tippingSystemModel.deliveredCoupons.length = 0;
    tippingTable.refreshTable();
    tippingTable.updateProgressBar();
    tippingTable.refreshDeliveredCouponCheckBoxes();
    tippingTable.tippingSystemModel.storeSystem();
};