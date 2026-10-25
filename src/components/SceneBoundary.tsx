import { Component, type ReactNode } from 'react';

/** Keep the puzzle catalogue usable on browsers without an available WebGL context. */
export class SceneBoundary extends Component<{children:ReactNode; fallback:ReactNode}, {failed:boolean}> {
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  render(){return this.state.failed ? this.props.fallback : this.props.children;}
}
