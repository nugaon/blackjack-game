import {
  Game,
  State,
  Player,
  Rule,
  SideBets,
  Card,
  HistoryItem,
  actions,
  presets
} from 'blackjack-engine'

export interface PlayerBank {
  bank: number;
  name: string;
}

export interface PlayerWithBank extends Player {
  bank: number
}

/// Public game state
export interface PublicGameState {
  players: Array<PlayerWithBank>;
  stage: State['stage'];
  availableBets: SideBets;
  dealerCards: Array<Card>;
  dealerValue: State['dealerValue'];
  history: Array<HistoryItem>;
  deckCardNumber: number;
}

export class GameService {

  private game!: Game;
  private playersBank!: Array<PlayerBank>; //always has to be deducted with bets
  private rules!: Rule

  constructor(players: Array<PlayerBank>, decks = 1) {
    this.playersBank = players
    //init state for game init
    this.rules = presets.getDefaultRules()
    this.rules.decks = decks
    const state: State = presets.defaultState(this.rules)
    state.players = this.playersInit(this.playersBank)
    //init game with modifications
    this.game = new Game(state)
  }

  private playersInit(players: Array<PlayerBank>): Array<Player> {
    const gamePlayers: Array<Player> = []
    for (const player of players) {
      const defaultPlayer: Player = presets.defaultPlayer(player.name)
      gamePlayers.push(defaultPlayer)
    }
    return gamePlayers
  }

  public getPublicState(): PublicGameState {
    const {
      players,
      stage,
      availableBets,
      dealerCards,
      dealerValue,
      history,
      deck
    } = this.game.getState()
    const state = this.game.getState()
    console.log('state', state)
    const playersWithBank = players.map(player => this.getPlayerWithBank(player))
    const deckCardNumber = deck.length

    return {
      players: playersWithBank,
      stage,
      availableBets,
      dealerCards,
      dealerValue,
      history,
      deckCardNumber
    }
  }

  public getPlayerWithBank(player: Player): PlayerWithBank {
    // If the players array can change, we would like to track the bank consistently also
    let bank = 0
    for (const playerBank of this.playersBank) {
      if(playerBank.name === player.name) {
        bank = playerBank.bank
        break
      }
    }

    return {
      ...player,
      bank
    }
  }

  /// playerLeave is the name of the players
  public newRound(playersLeave?: Array<string>): { shuffled: boolean } {
    const { stage, deck, players } = this.game.getState()
    if(stage.name !== 'STAGE_DONE') {
      throw Error(`Tried to make new round in a wrong stage: ${stage.name}`)
    }
    //add winning prizes to bank
    players.forEach(player => {
      const playerBank = this.playersBank.find(pb => pb.name === player.name)
      if(playerBank === undefined) {
        throw Error(`Error at adding prizes to ${player.name} player's bank`)
      }
      playerBank.bank += player.finalWin
      playerBank.bank += player.sideBetWins.luckyLucky ? player.sideBetWins.luckyLucky : 0
      playerBank.bank += player.sideBetWins.perfectPairs ? player.sideBetWins.perfectPairs : 0
      playerBank.bank += player.sideBetWins.insurance ? player.sideBetWins.insurance.win : 0
    })

    const state: State = presets.defaultState(this.rules)
    // filter out players who left
    if(playersLeave) {
      this.playersBank = this.playersBank.filter(player => {
        return playersLeave.findIndex(playerLeave => playerLeave === player.name) === -1
      })
    }
    //filter out bankroupt gamers
    const lostGamers = this.getPlayerNamesWithZeroBank();
    if(lostGamers.length > 0) {
      this.playersBank = this.playersBank.filter(player => {
        return lostGamers.findIndex(playerLeave => playerLeave === player.name) === -1
      })
    }
    state.players = this.playersInit(this.playersBank)
    // every player can get 4 cards and the dealer 3 at the new round in the worst case
    const shuffled: boolean = deck.length < state.players.length * 4 + 3
    if (!shuffled) {
      state.deck = deck
    }
    this.game = new Game(state)
    return { shuffled }
  }

  /// Returns players' names who has zero balance in the bank
  /// should be called after give winning prizes
  public getPlayerNamesWithZeroBank(): Array<string> {
    const { players } = this.game.getState()
    return players.map(
      player => this.getPlayerWithBank(player)
    ).filter(
      player => player.bank === 0
    ).map(
      player => player.name
    )
  }

  public bet(bet: number, playerId: number, sideBets?: { luckyLucky: number, perfectPairs: number }) {
    if(this.playersBank[playerId].bank - bet < 0) {
      return
    }
    //check at invalid state
    const { history } = this.game.dispatch(actions.bet({bet, playerId, sideBets}))
    if(!this.checkHistory(history)) {
      throw Error('Nope')
    }
    this.playersBank[playerId].bank -= bet
  }

  public insurance(bet: number, playerId: number) {
    if(this.playersBank[playerId].bank - bet < 0) {
      return
    }
    const { history } = this.game.dispatch(actions.insurance({bet, playerId}))
    //check at invalid state
    if(!this.checkHistory(history)) {
      throw Error('Nope')
    }
    this.playersBank[playerId].bank -= bet
  }

  public stand() {
    const { history } = this.game.dispatch(actions.stand())
    this.checkHistory(history)
  }

  public surrender() {
    const { history } = this.game.dispatch(actions.surrender())
    this.checkHistory(history)
  }

  public split() {
    const { players, stage } = this.game.getState()
    const playerId = stage.activePlayerId
    if (players === undefined || playerId === undefined) {
      throw Error('No players in the game... hmmm..')
    }

    const activeHandId = stage.activeHandId ? stage.activeHandId : 0
    const activeHand = players[playerId].hands[activeHandId]
    const bet = activeHand.bet ? activeHand.bet : 0
    if(this.playersBank[playerId].bank < bet) {
      alert('You don\'t have enough money for that!')
    }
    const { history } = this.game.dispatch(actions.split())
    if(!this.checkHistory(history)){
      return;
    }
    this.playersBank[playerId].bank -= bet
  }

  public hit() {
    const { history } = this.game.dispatch(actions.hit())
    this.checkHistory(history)
  }

  public double() {
    const { players, stage } = this.game.getState()
    const playerId = stage.activePlayerId
    if (players === undefined || playerId === undefined) {
      throw Error('No players in the game... hmmm..')
    }
    const activeHandId = stage.activeHandId ? stage.activeHandId : 0
    const activeHand = players[playerId].hands[activeHandId]
    const bet = activeHand.bet ? activeHand.bet : 0
    if(this.playersBank[playerId].bank < bet) {
      alert('You don\'t have enough money for that!')
    }
    const { history } = this.game.dispatch(actions.double())
    if(!this.checkHistory(history)){
      return;
    }
    this.playersBank[playerId].bank -= bet
  }

  /// If invalid action happened returns false
  checkHistory(history: State['history']): boolean {
    const lastHistoryItem = history[history.length - 1]
    if(lastHistoryItem && lastHistoryItem.action.type === 'INVALID') {
      const info = lastHistoryItem.action.payload ? lastHistoryItem.action.payload.info : ''
      throw Error(info)
    }
    return true
  }
}
