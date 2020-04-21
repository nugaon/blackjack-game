import React, { FunctionComponent, ReactElement } from 'react'; // we need this to make JSX compile
import './css/cards/cards.css'

interface CardProps {
  rank:
  | 'A'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | 'J'
  | 'Q'
  | 'K';
  suite: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  size?: number;
}

interface CardContainerProps {
  fourColours?: boolean;
  cardStyle?: "faceImages" | "simpleCards" | "inText";
  rotateHand?: boolean;
}

export const Card: FunctionComponent<CardProps> = ({
  rank,
  suite,
  size = 24
}) => {
  const suiteClass = suite === 'diamonds' ? 'diams' : suite
  const htmlEntity = { __html: `&${suiteClass};` }
  return (
    <div className={`playingCards card rank-${rank.toLowerCase() } `
      + `${suiteClass}`} style={{fontSize: size}}>
      <span className="rank">{rank}</span>
      <span dangerouslySetInnerHTML={htmlEntity} className="suit"></span>
    </div>
  )
}

interface CardGroupProps {
  grouping: 'table' | 'hand' | 'deck'
}

export const CardBack = () => <div className="card back">*</div>

export const CardGroup: FunctionComponent<CardGroupProps> = ({ grouping, children }) => {
  if(children === undefined || children === null) {
    throw Error('No Cards at CardGroup')
  }
  const childrenArray = React.Children.toArray(children)
  const cards = React.Children.map(childrenArray, (child: React.ReactNode, index: number) =>
      React.cloneElement(<li key={index}>{child}</li>) // should be ok
  );

  return (
    <ul className={grouping} >
      { cards }
    </ul>
  )
}

export const CardContainer: FunctionComponent<CardContainerProps> = ({
  fourColours = false,
  cardStyle = "faceImages",
  rotateHand = false,
  children
}) => <div className={ 'playingCards'
    + ` ${cardStyle} ${rotateHand ? 'rotateHand' : ''} `
    + ` ${fourColours ? 'fourColours' : ''}`}>{ children }</div>
