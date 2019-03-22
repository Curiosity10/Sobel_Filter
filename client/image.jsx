import React, { Component } from 'react';

export default class Image extends Component {
  componentWillReceiveProps(nextProps, nextContext) {
    this.render();
  }

  render () {
    const { fileName } = this.props;
    return (
      <img className='images_item' alt='image' src={ fileName }/>
    )
  }
};

