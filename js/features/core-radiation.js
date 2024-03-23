const CORE_RAD = {
    experiment() {
        var rad = player.core.radiation

        rad.active = !rad.active
        
        doReset("core",true)
    },

    gain() {
        let x = this.genValue(player.core.radiation.gen).mul(sharkUpgEffect('s5')).mul(tmp.explore_eff[4]??1)

        return x
    },

    limit() {
        let x = Decimal.mul(this.limitIncrease(),1e6).div(simpleResearchEffect("c6"))

        if (hasDepthMilestone(4,0)) x = x.div(1e3)

        return x
    },

    limitIncrease() {
        let x = Decimal.pow(1e3,player.core.radiation.boost.scale(10,2,0).pow(1.25))

        return x
    },

    purchaseBoost() {
        var rad = player.core.radiation
        if (rad.amount.gte(this.limit())) {
            player.core.radiation.boost = player.core.radiation.boost.add(1)

            rad.amount = E(0)
            rad.gen = E(0)

            resetSharkUpgrades('s5')
            doReset("core",true)
        }
    },

    genCost: l => Decimal.pow('e850', Decimal.pow(1.05, l)),
    genBulk: x => x.log('e850').log(1.05).floor().add(1),

    genValue: l => Decimal.pow(2,l.sub(1)).mul(l),

    purchaseGeneration() {
        if (!tmp.cr_active) return
        let x = player.core.radiation.gen, amt = CURRENCIES.fish.amount
        if (amt.gte(this.genCost(x))) {
            player.core.radiation.gen = this.genBulk(amt).max(x.add(1))
        }
    },

    boosts: [
        {
            req: 0,
            effect: (r,b)=>{
                let x = r.add(1).log10().mul(b.add(1)).root(2)

                return x
            },
        },{
            req: 1,
            effect: (r,b)=>{
                let x = expPow(r.add(1),1/3).pow(b.div(4).add(1))

                return x
            },
        },{
            req: 2,
            effect: (r,b)=>{
                let x = r.add(1).log10().root(2).mul(b.add(1)).div(100).add(1)

                return x
            },
        },{
            req: 9,
            effect: (r,b)=>{
                let x = r.add(1).log10().root(2).mul(b.add(10))

                return x
            },
        },{
            req: 13,
            effect: (r,b)=>{
                let x = r.add(1).log10().div(5000).mul(b.add(1).root(2))

                return x
            },
        },
    ],
}

function getCRBoost(i,def=1) { return tmp.cr_boost[i] ?? def }

function updateCoreRadiation() {
    var rad = player.core.radiation

    el('radioactive-amount').innerHTML = rad.amount.format(0) + " / " + tmp.cr_limit.format(0) + " " + icon("radioactive")
    el('radioactive-gain').innerHTML = tmp.cr_gain.gt(0) ? rad.amount.formatGain(tmp.cr_gain) : ""

    el('start-cr-experiment').innerHTML = lang_text('cr-start',rad.active)

    var cost = CORE_RAD.genCost(rad.gen)
    el('upgrade-cr-btn').innerHTML = lang_text('upgrade-cr',CORE_RAD.genValue(rad.gen),cost)
    el('upgrade-cr-btn').className = el_classes({locked: !tmp.cr_active || CURRENCIES.fish.amount.lt(cost), 'huge-btn': true})

    el('reset-cr-btn').innerHTML = lang_text('reset-cr',CORE_RAD.limitIncrease())
    el('reset-cr-btn').className = el_classes({locked: rad.amount.lt(tmp.cr_limit), 'huge-btn': true})

    let h = "", boosts_list = lang_text("cr-boosts"), boost = player.core.radiation.boost

    for (let i = 0; i < CORE_RAD.boosts.length; i++) if (boost.gte(CORE_RAD.boosts[i].req)) h += boosts_list[i](tmp.cr_boost[i])+`<br>`

    el('cr-boosts-div').innerHTML = h

    el('radioactive-boost').innerHTML = format(player.core.radiation.boost,0)
}

function updateCoreRadiationTemp() {
    tmp.cr_gain = CORE_RAD.gain()
    tmp.cr_limit = CORE_RAD.limit()

    var amt = player.core.radiation.amount, b = player.core.radiation.boost

    for (let i = 0; i < CORE_RAD.boosts.length; i++) {
        let boost = CORE_RAD.boosts[i]
        tmp.cr_boost[i] = boost.effect(b.gte(boost.req) ? amt : Decimal.dZero, b.sub(boost.req).max(0))
    }
}