import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Line } from 'rc-progress';
import styles from './style.css';
import Image from './image.jsx';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      images: [],
      allImagesLength: null,
      color: 'white'
    };
  }

  componentDidMount() {
    this.interval =
      setInterval(() => {
        fetch('http://localhost:3000/images')
        .then(( data ) => {
          return data.json();
        })
        .then(( { images, allImagesLength} ) => {
          this.setState({ images, allImagesLength });
        })
        .catch(() => console.log('error in fetch'))
      }, 1000);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }
  onBackgroundChange = () => {
    const colors = ['yellow', 'green', 'blue', 'red', 'lightcoral',
      'brown', 'orangered', 'goldenrod', 'lawngreen', 'forestgreen',
    'mediumseagreen', 'mediumspringgreen', 'turquoise', 'lightseagreen', 'lightskyblue',
    'steelblue', 'blueviolet', 'orchid', 'palevioletred' , 'pink'];
    const idx = Math.round(Math.random() * (colors.length - 1));
    const newColor = colors[idx];
    this.setState({ color: newColor })
  };

  render() {
    const { images, allImagesLength, color } = this.state;
    const imgs = images.map( item => <Image fileName={item}/>);
    return (<section className='container'>

      <h1 className='header'>Sobel filter in JS</h1>

      <section className='progress-bar'>
        <h3>Images processed: {Math.round((images.length / allImagesLength) * 100) + '%'}</h3>
        <Line percent={(images.length / allImagesLength) * 100} strokeWidth='1' strokeColor='#31ea46' />
      </section>

      <button className='button' onClick={ this.onBackgroundChange }>Change Background</button>

      <section className='images' style={{background: color}}>
        { imgs }
      </section>
    </section>)
  }
  }

ReactDOM.render(<App/>, document.getElementById('root'));