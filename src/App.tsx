import React, { useState, useEffect } from 'react';
import logo from './logo.svg';
import './App.css';
import { Card, CardGroup, CardContainer, CardBack } from './Cards'
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Row, Col, Form, Button, InputGroup } from 'react-bootstrap';
import { Card as EngineCard, Hand } from 'blackjack-engine';
import { GameService, PlayerWithBank } from './services/GameService';

let gameService: GameService;

const engineCardsToDom = (cards: Array<EngineCard>, size = 20): Array<React.ReactNode> => {
  return cards.map(engineCard => {
    return (
      <Card key={engineCard.text + engineCard.suite} rank={engineCard.text} suite={engineCard.suite} size={size}/>
    )
  })
}

interface PlayerFieldProps {
  stage: GameStage
  positionAtTable: number; //position at playerField
  positionInEngine?: number; //playerId which used to be called egnine methods
  playerInEngine?: PlayerWithBank | undefined;
  activeInEngine?: boolean;
  activeHand?: number;
  onSetName?: Function | undefined;
  onEngineAction?: Function | undefined;
}

const PlayerField = ({
  stage,
  positionAtTable = -1, //index in playerFields array
  positionInEngine = -1,
  playerInEngine = undefined,
  onSetName = undefined,
  activeInEngine = false,
  activeHand = -1,
  onEngineAction = undefined,
}: PlayerFieldProps) => {
  const [passedName, setPassedName] = useState('')
  const [betSent, setBetSent] = useState(false)
  const [insuranceSent, setInsuranceSent] = useState(false)
  useEffect(() => {
    if(stage === 'STAGE_DONE') {
      setBetSent(false)
      setInsuranceSent(false)
    }
  });
  const hands: Array<Hand> = playerInEngine && playerInEngine.hands && playerInEngine.hands.length > 0 ? playerInEngine.hands : []
  const showHandId = activeHand > -1 ?
    activeHand
    :
    (hands ? hands.length - 1 : activeHand)
  const miniDomCards = hands
    .filter((hand, i) => i !== showHandId)
    .map(hand => engineCardsToDom(hand.cards, 5))
  const activeHandInEngine: Hand | undefined  = showHandId > -1 ? hands[showHandId] : undefined
  const domCards = engineCardsToDom(activeHandInEngine ? activeHandInEngine.cards : [])
  const name = playerInEngine ? playerInEngine.name : passedName

  let playerState = ''
  let playerValue = 0
  let canSurrender = false
  let canSplit = false
  let canHit = false
  let canDouble = false
  if(activeHandInEngine) {
    const playerV = activeHandInEngine.playerValue
    playerValue = playerV.hi > 21 ? playerV.lo : playerV.hi
    if(activeHandInEngine.playerHasBlackjack) {
      playerState = '!BLACKJACK!'
    } else if (activeHandInEngine.playerHasBusted) {
      playerState = 'BUSTED'
    } else if (activeHandInEngine.playerHasSurrendered) {
      playerState = 'SURRENDERED'
    }
    canDouble = activeHandInEngine.availableActions.double
    canSurrender = activeHandInEngine.availableActions.surrender
    canSplit = activeHandInEngine.availableActions.split
      && activeHandInEngine.cards
      && activeHandInEngine.cards.length > 1
    canHit = activeHandInEngine.availableActions.hit
    canDouble = activeHandInEngine.availableActions.double
  }
  const handBet = activeHandInEngine ? activeHandInEngine.bet : 0
  const finalWin = playerInEngine && playerInEngine.finalWin ? playerInEngine.finalWin : 0

  const passSetName = (e) => {
    e.preventDefault()
    const name = e.target.elements.name.value
    if(!onSetName) {
      throw Error('onSetName function hasn\'t been set at PlayerField')
    }
    if(name === '') {
      throw Error('Give a name for the player before join')
    }
    setPassedName(name)
    onSetName(positionAtTable, name)
  }

  const handleBet = (e) => {
    e.preventDefault()
    if(positionInEngine < 0) {
      throw Error(`Unefficient engineId at user ${name}`)
    }
    if(onEngineAction === undefined) {
      throw Error(`not setted onEngineAction method at player ${name}`)
    }
    console.log('posi', positionInEngine)
    const bet = +e.target.elements.bet.value
    try {
      gameService.bet(bet, positionInEngine)
      setBetSent(true)
      onEngineAction()
    } catch(e) {
      alert(e.message)
    }
  }

  const handleInsurance = (e) => {
    e.preventDefault()
    if(positionInEngine < 0) {
      throw Error(`Unefficient engineId at user ${name}`)
    }
    if(onEngineAction === undefined) {
      throw Error(`not setted onEngineAction method at player ${name}`)
    }
    console.log('posi', positionInEngine)
    const bet = +e.target.elements.bet.value
    try {
      gameService.insurance(bet, positionInEngine)
      setInsuranceSent(true)
      onEngineAction()
    } catch(e) {
      alert(e.message)
    }
  }

  const handlePlayerAction = (actionName: 'HIT' | 'STAND' | 'SURRENDER' | 'SPLIT' | 'DOUBLE') => {
    if(onEngineAction === undefined) {
      throw Error(`not setted onEngineAction method at player ${name}`)
    }
    switch(actionName) {
      case 'HIT': {
        gameService.hit()
        break
      }
      case 'STAND': {
        gameService.stand()
        break
      }
      case 'SURRENDER': {
        gameService.surrender()
        break
      }
      case 'SPLIT': {
        try {
          gameService.split()
        } catch(e) {
          alert(e.message)
        }
        break
      }
      case 'DOUBLE': {
        try {
          gameService.double()
        } catch(e) {
          alert(e.message)
        }
        break
      }
    }
    onEngineAction()
  }

  return (
    <Col>
      <div className="playerField">
        <Row className="justify-content-center">
          <Col>
            <div className="sub-title" hidden={name === ''}>
              <span hidden={!activeInEngine}>&gt;&nbsp;</span>{name}<span hidden={!activeInEngine}>&nbsp;&lt;</span>
            </div>
            <div className="cardHolder">
              <div className="sub-title" hidden={playerState === ''}>
                <span style={{color: playerState === 'BUSTED' ? 'white' : 'red'}}>{playerState}</span>
              </div>
              <Form hidden={name !== ''} onSubmit={passSetName} className="marginBottom">
                <InputGroup>
                  <Form.Control
                    name="name"
                    placeholder="Player Name"
                    style={{textAlign: 'center'}}
                    required
                  />
                  <InputGroup.Append>
                    <Button variant="primary" type="submit">
                      Join
                    </Button>
                  </InputGroup.Append>
                </InputGroup>
              </Form>
              <CardContainer style={{ display: 'inline-block' }} rotateHand={true}>
                <CardGroup style={{left: -70}} grouping="hand">
                  {domCards}
                </CardGroup>
              </CardContainer>

              <CardContainer cardStyle='inText'>
                {miniDomCards.map((cards, i) => {
                    return <CardGroup key={i} grouping="table">
                      <span style={{color: 'white'}}>{i + 1}.</span>
                      {cards}
                    </CardGroup>
                 })}

              </CardContainer>

              <div style={{color: 'white', clear: 'both'}}>
                <div hidden={playerValue === 0}>
                  {showHandId + 1 }. hand <br />
                  {playerValue} Value | <span hidden={handBet === 0}>{handBet} €</span>
                </div>
                <div hidden={playerInEngine === undefined || playerInEngine.bank === undefined}>
                  Bank {playerInEngine && playerInEngine.bank ? playerInEngine.bank : 0} €
                </div>
                <div hidden={finalWin === 0}>
                  Win: {finalWin}
                </div>
              </div>

              <div hidden={stage !== 'STAGE_READY' || betSent}>
                <Form onSubmit={handleBet}>
                  <InputGroup>
                    <Form.Control
                      name="bet"
                      defaultValue="10"
                      type="number"
                      style={{textAlign: 'right'}}/>
                    <Button
                      variant="primary" type="submit" value="Submit">
                      Bet
                    </Button>
                  </InputGroup>
                </Form>
              </div>
              <div hidden={stage !== 'STAGE_INSURANCE' || insuranceSent}>
                <Form onSubmit={handleInsurance}>
                  <InputGroup>
                    <Form.Control
                      name="bet"
                      defaultValue="0"
                      type="number"
                      style={{textAlign: 'right'}}/>
                    <Button
                      variant="primary" type="submit" value="Submit">
                      Bet
                    </Button>
                  </InputGroup>
                </Form>
              </div>
              <div hidden={!activeInEngine}>
                <Button
                  variant="secondary" type="submit" value="Submit" onClick={(e) => handlePlayerAction('STAND')}>
                  Stand
                </Button>
                <Button hidden={!canSurrender}
                  variant="secondary" type="submit" value="Submit" onClick={(e) => handlePlayerAction('SURRENDER')}>
                  Surrender
                </Button>
                <Button hidden={!canSplit}
                  variant="secondary" type="submit" value="Submit" onClick={(e) => handlePlayerAction('SPLIT')}>
                  Split
                </Button>
                <Button hidden={!canHit}
                  variant="secondary" type="submit" value="Submit" onClick={(e) => handlePlayerAction('HIT')}>
                  Hit
                </Button>
                <Button hidden={!canDouble}
                  variant="secondary" type="submit" value="Submit" onClick={(e) => handlePlayerAction('DOUBLE')}>
                  Double
                </Button>
              </div>
            </div>
          </Col>
        </Row>
      </div>
    </Col>
  )
}

const getDeckDom = (cardNumber: number): Array<React.ReactElement> => {
  const deckDom: Array<React.ReactElement> = []
  for(let i = 0; i < cardNumber; i++) {
    deckDom.push(<CardBack key={i} />)
  }
  return deckDom
}

const getPlayerInEngineFromName =
  (name: string):
  {
    player: PlayerWithBank,
    position: number,
    active: boolean
  } => {
    const currentState = gameService.getPublicState()
    const position = currentState.players.findIndex(player => player.name === name)
    if(position === undefined) {
      throw Error(`No player has found in the engine with name ${name}`)
    }
    const player = currentState.players[position]
    const active = currentState.stage.activePlayerId === position
    return {
      player,
      position,
      active
    }
}

type GameStage =
| 'STAGE_GAME_DEFINITION' //at start
| 'STAGE_PREPARATION' //join/leave table
| 'STAGE_READY' //bets
| 'STAGE_INSURANCE' //insurances
| 'STAGE_PLAYERS_TURN' //players' actions
| 'STAGE_DONE' //after showdown
| 'STAGE_DEAL_CARDS' //if smth happened wrong in the engine
| 'STAGE_SHOWDOWN' //if smth happened wrong in the engine
| 'STAGE_DEALER_TURN'; //if smth happened wrong in the engine

function App() {
  const [playerFields, setPlayerFields] = useState<Array<React.ReactElement>>([]);
  const [deckNumber, setDeckNumber] = useState<number>(1);
  const [deckDom, setDeckDom] = useState<Array<React.ReactElement>>([]);
  const [playerMap, setPlayerMap] = useState<Array<{name: string, position: number}>>([]); //mapping to the core[name] -> frontend[position]
  const [dealerCards, setDealerCards] = useState<Array<React.ReactNode>>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [gameStage, setGameStage] = useState<GameStage>('STAGE_GAME_DEFINITION');
  const [dealerCardsValue, setDealerCardsValue] = useState(0)

  const handleNewGame = (e) => {
    e.preventDefault()
    const seats = +e.target.elements.seats.value
    const decks = +e.target.elements.decks.value
    if (seats > 5 || seats < 1) {
      setErrorMessage('Maximum 5, minimum 1 seats can be at the table')
      return
    }
    if (decks > 5 || decks < 1) {
      setErrorMessage('Maximum 5, minimum 1 decks can be in the game')
      return
    }

    // generate playerFields
    const genPlayerFields: Array<React.ReactElement> = []
    for (let i = 0; i < seats; i++) {
      genPlayerFields.push(<PlayerField key={i} positionAtTable={i} stage={gameStage} onSetName={handleSetName} />)
    }

    setPlayerFields(genPlayerFields)
    setGameStage('STAGE_PREPARATION')
    setDeckNumber(decks)
    setDeckDom(getDeckDom(Math.floor(decks * 52 / 8)))
  }

  /// generate player engine objects when push the start new round button
  const handleSetName = (position: number, name: string) => {
    console.log('playermap before', typeof playerMap)
    playerMap.push({position, name})
    setPlayerMap(playerMap)
  }

  const startNewRound = () => {
    if(gameService === undefined) {
      gameService = new GameService(
        playerMap.map(player => {
          return {name: player.name, bank: 1000}
        }),
        deckNumber
      )

    } else {
      const lostGamers = gameService.getPlayerNamesWithZeroBank();
      gameService.newRound(lostGamers)
    }
    mapGameEngineState()
  }

  const mapGameEngineState = () => {
    if(gameService === undefined) {
      throw Error('No inited gameService at state mapping')
    }
    const {
      players,
      stage,
      availableBets,
      dealerCards,
      dealerValue,
      history,
      deckCardNumber
    } = gameService.getPublicState()
    console.log('history', history)
    const stageName = stage.name
    setGameStage(stageName)
    setDealerCards(engineCardsToDom(dealerCards))
    // Set Player Fields
    const playerFields: Array<React.ReactElement> = []
    for (const positionInEngine in players) {
      const playerInEngine: PlayerWithBank = players[+positionInEngine]
      const playerAtTable = playerMap.find(p => p.name === playerInEngine.name)
      if (!playerAtTable) {
        throw Error('Position undefined on player search at table')
      }
      const active = stage.activePlayerId === +positionInEngine
      const activeHandId = active ? stage.activeHandId : -1

      playerFields.push(
        <PlayerField
          key={playerAtTable.position}
          positionAtTable={playerAtTable.position}
          stage={stage.name}
          positionInEngine={+positionInEngine}
          playerInEngine={playerInEngine}
          activeInEngine={active}
          onEngineAction={mapGameEngineState}
          activeHand={activeHandId}
        />
      )
      setDealerCardsValue(dealerValue.hi > 21 ? dealerValue.lo : dealerValue.hi)
    }
    console.log(playerFields)
    setPlayerFields(playerFields)
    const dn = Math.floor(deckCardNumber / 8)
    setDeckDom(getDeckDom(dn === 0? 1 : dn))
  }

  let stageText = ''
  switch(gameStage) {
    case 'STAGE_READY': {
      stageText = 'Take bets'
      break
    }
    case 'STAGE_INSURANCE': {
      stageText = 'Make insurance bets (can be 0)'
      break
    }
    case 'STAGE_PLAYERS_TURN': {
      stageText = 'Players\' turn'
      break
    }
    case 'STAGE_PREPARATION': {
      stageText = 'Take seats please'
      break
    }
    case 'STAGE_DONE': {
      stageText = 'This round has ended'
      break
    }
  }

  return (
    <div className="App">
      <Container>

        {/* new game */}
        <div hidden={gameStage !== 'STAGE_GAME_DEFINITION'}>
          <Container>
          <div className="title">
            <span>Jack Black</span> <br />
          </div>
          <Form className="cardHolder" onSubmit={ handleNewGame }>
            <div className="title">
              <span>New Game</span>
            </div>
            <div style={{ fontSize: 30, width: 200, margin: 'auto', padding: 10, marginBottom: 24}}>
              <div className="inputGroup">
                <div>Seats</div>
                <Form.Control name="seats" defaultValue="1" type="number"/>
              </div>

              <div className="inputGroup">
                <div>Deck</div>
                <Form.Control name="decks" defaultValue="1" type="number"/>
              </div>

              <div className="error">
                {errorMessage}
              </div>
              <Button variant="primary" type="submit" value="Submit" style={{marginTop: 24}}>
                Create
              </Button>
            </div>
          </Form>
          </Container>
        </div>

        {/* game */}
        <div hidden={gameStage === 'STAGE_GAME_DEFINITION'}>
          {/* Dealer section */}
          <Row className="justify-content-center">
            <Col>
              <div className="sub-title">
                Dealer
              </div>
              <div className="cardHolder">
                <CardContainer style={{display: 'inline-block'}}>
                  <CardGroup grouping="table">
                    {dealerCards}
                    <span hidden={dealerCards.length !== 1}>
                      <CardBack />
                    </span>
                  </CardGroup>
                </CardContainer>
                <div style={{color: 'white'}} hidden={dealerCardsValue === 0}>
                  {dealerCardsValue} Value
                </div>
              </div>
            </Col>
          </Row>
          <CardContainer className="floatTopRight">
            <CardGroup grouping='deck'>
              {deckDom}
            </CardGroup>
          </CardContainer>

          {/* Game action buttons */}
          <div className="tableDevider">
            <div className="sub-title" style={{color: 'white'}}>
              {stageText}
            </div>
            <div hidden={gameStage !== 'STAGE_PREPARATION' && gameStage !== 'STAGE_DONE'}>
              <Button variant="primary" onClick={startNewRound}>Start new round</Button>
            </div>
          </div>

          {/* Players section */}
          <div className="playerFields">
            <Row>
              {playerFields}
            </Row>
          </div>
        </div>
      </Container>
    </div>
  );
}

export default App;
