import React from 'react';
import logo from './logo.svg';
import './App.css';
import { Card, CardGroup, CardContainer } from './Cards'
// import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  return (
    <div className="App">
      <div>
        <div className="PlayerName">
          Dealer
        </div>
        <div>
          <CardContainer>
            <CardGroup grouping="hand">
              <Card rank="A" suite="clubs" />
              <Card rank="K" suite="diamonds" />
            </CardGroup>
          </CardContainer>
        </div>
      </div>
    </div>
  );
}

export default App;
