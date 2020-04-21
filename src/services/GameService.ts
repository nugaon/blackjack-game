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
  history: Array<HistoryItem>
}

export class GameService {

  private game!: Game;
  private playersBank!: Array<PlayerBank>; //always has to be deducted with bets
  private rules!: Rule

  GameService(players: Array<PlayerBank>, decks = 1) {
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
      history
    } = this.game.getState()
    const playersWithBank = players.map(player => this.getPlayerWithBank(player))

    return {
      players: playersWithBank,
      stage,
      availableBets,
      dealerCards,
      dealerValue,
      history
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

  public newRound(playersLeave: Array<string>): { shuffled: boolean } {
    const { stage, deck } = this.game.getState()
    if(stage.name !== 'STAGE_DONE') {
      throw Error(`Tried to make new round in a wrong stage: ${stage.name}`)
    }

    const state: State = presets.defaultState(this.rules)
    // filter out players who left
    this.playersBank = this.playersBank.filter(player => {
      return playersLeave.findIndex(playerLeave => playerLeave === player.name) !== -1
    })
    state.players = this.playersInit(this.playersBank)
    // every player can get 4 cards and the dealer 3 at the new round in the worst case
    const shuffled: boolean = deck.length < state.players.length * 4 + 3
    if (!shuffled) {
      state.deck = deck
    }
    this.game = new Game(state)
    return { shuffled }
  }
}
