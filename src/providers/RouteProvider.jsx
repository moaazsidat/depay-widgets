import DePayRouterV1Contract from '../contracts/DePayRouterV1Contract';
import Erc20Abi from '../abi/Erc20Abi';
import EthersProvider from '../utils/EthersProvider';
import Exchanges from '../utils/Exchanges';
import React from 'react';
import RouteContext from '../contexts/RouteContext';
import { ETH } from '../utils/Constants';
import { ethers } from 'ethers';

class RouteProvider extends React.Component {
  state = {
    loading: false,
    fromAmount: null,
    toAmount: null,
    route: null
  }

  componentDidUpdate(prevProps) {
    if(this.props.to && this.props.from) {
      if(this.props.fromAmount && (this.state.fromAmount !== this.props.fromAmount)) {
        this.setState({
          loading: true,
          fromAmount: this.props.fromAmount,
          toAmount: null
        }, this.findRouteFromTo)
      } else if (this.props.toAmount && this.state.toAmount !== this.props.toAmount) {
        this.setState({
          loading: true,
          toAmount: this.props.toAmount,
          fromAmount: null
        }, this.findRouteToFrom)
      }
    }
  }

  addApprovalStateToRoute(route) {
    return new Promise(function(resolve, reject){
      if(route.path[0] === ETH) {
        route.approved = true;
        resolve(route);
      } else {
        new ethers.Contract(route.path[0], Erc20Abi, EthersProvider)
        .allowance(this.props.wallet.address(), DePayRouterV1Contract.address)
        .then(function(amount){
          if(amount.gt(ethers.BigNumber.from(route.amounts[0]))) {
            route.approved = true;
          } else {
            route.approved = false;
          }
          resolve(route);
        });
      }
    });
  }

  findRouteFromTo() {
    Exchanges.findBestRouteFromTo(
      this.props.from,
      this.state.fromAmount,
      this.props.to
    ).then(function(route){
      this.addApprovalStateToRoute(route).then(function(route){
        this.setState({
          route: route,
          loading: false,
          toAmount: _.last(route.amounts).toString()
        })
      }.bind(this))
    }.bind(this))
  }

  findRouteToFrom() {
    console.log('findRouteToFrom');
  }

  render() {
    return(
      <RouteContext.Provider value={{
        loading: this.state.loading,
        route: this.state.route,
        fromAmount: this.state.fromAmount,
        toAmount: this.state.toAmount
      }}>
        {this.props.children}
      </RouteContext.Provider>
    )
  }
}

export default RouteProvider;
