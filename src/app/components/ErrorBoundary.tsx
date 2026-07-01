import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

// React error boundaries must be class components. This catches unexpected
// render errors anywhere in the tree and shows a branded fallback instead of
// a blank white screen.
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Logged to the browser console; could be wired to an error service later.
    console.error('Unhandled UI error:', error, info)
  }

  handleReload = () => {
    this.setState({ hasError: false })
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden on-media section--dark">
          <div
            className="absolute top-0 left-0 w-96 h-96 corner-bracket"
            style={{ clipPath: 'polygon(0 0, 100% 0, 100% 60px, 60px 60px, 60px 100%, 0 100%)' }}
          />
          <div className="relative z-10 text-center px-6 py-24 max-w-2xl">
            <div className="mb-4 text-sm tracking-[0.3em] uppercase text-accent">Something Went Wrong</div>
            <h1
              className="mb-6"
              style={{ fontSize: 'clamp(2.5rem, 8vw, 5rem)', fontWeight: 700, lineHeight: 0.95, letterSpacing: '-0.02em' }}
            >
              UNEXPECTED ERROR
            </h1>
            <p className="text-xl opacity-90 mb-10">
              Something didn't load as expected. Please try again — if the problem persists, get in touch and we'll sort it out.
            </p>
            <button
              onClick={this.handleReload}
              className="btn-bronze inline-block px-10 py-4 text-sm tracking-wider uppercase transition-all"
              style={{ clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))' }}
            >
              Back to Home
            </button>
          </div>
        </section>
      )
    }

    return this.props.children
  }
}
