import React, { ComponentType, ReactNode } from 'react'

// Component composition utilities
export function composeComponents<T>(
  ...components: React.ComponentType<T>[]
): React.ComponentType<T> {
  return function Composed(props: T) {
    return components.reduceRight((acc, Component) => {
      return <Component {...props}>{acc}</Component>
    }, props.children as ReactNode)
  }
}

// Higher-order components for common patterns
export function withLoading<P>(
  Component: React.ComponentType<P>,
  LoadingComponent: React.ComponentType<{ isLoading: boolean }>,
): React.ComponentType<P & { isLoading?: boolean }> {
  return function WithLoading(props: P & { isLoading?: boolean }) {
    const { isLoading, ...restProps } = props

    if (isLoading) {
      return <LoadingComponent isLoading={true} />
    }

    return <Component {...(restProps as P)} />
  }
}

export function withError<P>(
  Component: React.ComponentType<P>,
  ErrorComponent: React.ComponentType<{ error: string | null }>,
): React.ComponentType<P & { error?: string | null }> {
  return function WithError(props: P & { error?: string | null }) {
    const { error, ...restProps } = props

    if (error) {
      return <ErrorComponent error={error} />
    }

    return <Component {...(restProps as P)} />
  }
}

export function withEmpty<P>(
  Component: React.ComponentType<P>,
  EmptyComponent: React.ComponentType<{ isEmpty: boolean }>,
  isEmptyCheck: (props: P) => boolean,
): React.ComponentType<P> {
  return function WithEmpty(props: P) {
    const isEmpty = isEmptyCheck(props)

    if (isEmpty) {
      return <EmptyComponent isEmpty={true} />
    }

    return <Component {...props} />
  }
}

// Component lifecycle utilities
export function withOnMount<P>(
  Component: React.ComponentType<P>,
  onMount: (props: P) => void | (() => void),
): React.ComponentType<P> {
  return function WithOnMount(props: P) {
    React.useEffect(() => {
      const cleanup = onMount(props)
      return cleanup
    }, [])

    return <Component {...props} />
  }
}

export function withOnUpdate<P>(
  Component: React.ComponentType<P>,
  onUpdate: (prevProps: P, currentProps: P) => void,
): React.ComponentType<P> {
  return function WithOnUpdate(props: P) {
    const prevPropsRef = React.useRef<P>(props)

    React.useEffect(() => {
      onUpdate(prevPropsRef.current, props)
      prevPropsRef.current = props
    })

    return <Component {...props} />
  }
}

export function withOnUnmount<P>(
  Component: React.ComponentType<P>,
  onUnmount: (props: P) => void,
): React.ComponentType<P> {
  return function WithOnUnmount(props: P) {
    React.useEffect(() => {
      return () => onUnmount(props)
    }, [])

    return <Component {...props} />
  }
}

// Component performance utilities
export function withMemo<P>(
  Component: React.ComponentType<P>,
  memoCheck: (prevProps: P, nextProps: P) => boolean,
): React.ComponentType<P> {
  return React.memo(Component, memoCheck)
}

export function withCallback<P>(
  Component: React.ComponentType<P>,
  callbackProps: (keyof P)[],
): React.ComponentType<P> {
  return function WithCallback(props: P) {
    const memoizedCallbacks = React.useMemo(() => {
      const callbacks: Partial<P> = {}
      
      callbackProps.forEach(prop => {
        if (typeof props[prop] === 'function') {
          callbacks[prop] = React.useCallback(props[prop] as any, [])
        }
      })
      
      return callbacks
    }, [])

    return <Component {...props} {...memoizedCallbacks} />
  }
}

// Component state utilities
export function withState<P, S>(
  Component: React.ComponentType<P & { state: S; setState: React.Dispatch<React.SetStateAction<S>> }>,
  initialState: S | (() => S),
): React.ComponentType<Omit<P, 'state' | 'setState'>> {
  return function WithState(props: Omit<P, 'state' | 'setState'>) {
    const [state, setState] = React.useState(initialState)

    return <Component {...props} state={state} setState={setState} />
  }
}

export function withReducer<P, S, A>(
  Component: React.ComponentType<P & { state: S; dispatch: React.Dispatch<A> }>,
  reducer: React.Reducer<S, A>,
  initialState: S,
): React.ComponentType<Omit<P, 'state' | 'dispatch'>> {
  return function WithReducer(props: Omit<P, 'state' | 'dispatch'>) {
    const [state, dispatch] = React.useReducer(reducer, initialState)

    return <Component {...props} state={state} dispatch={dispatch} />
  }
}

// Component context utilities
export function withContext<T, P>(
  Component: React.ComponentType<P & T>,
  Context: React.Context<T | undefined>,
  contextName?: string,
): React.ComponentType<Omit<P, keyof T>> {
  return function WithContext(props: Omit<P, keyof T>) {
    const contextValue = React.useContext(Context)
    
    if (contextValue === undefined) {
      throw new Error(
        `${contextName || 'Component'} must be used within a ${Context.displayName || 'Context'}Provider`
      )
    }

    return <Component {...props} {...contextValue} />
  }
}

// Component error boundary utilities
export function withErrorBoundary<P>(
  Component: React.ComponentType<P>,
  FallbackComponent: React.ComponentType<{ error: Error; retry: () => void }>,
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void,
): React.ComponentType<P> {
  return class WithErrorBoundary extends React.Component<P> {
    state = { hasError: false, error: null as Error | null }

    static getDerivedStateFromError(error: Error) {
      return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      if (onError) {
        onError(error, errorInfo)
      }
    }

    handleRetry = () => {
      this.setState({ hasError: false, error: null })
    }

    render() {
      if (this.state.hasError && this.state.error) {
        return <FallbackComponent error={this.state.error} retry={this.handleRetry} />
      }

      return <Component {...this.props} />
    }
  }
}

// Component styling utilities
export function withStyles<P>(
  Component: React.ComponentType<P>,
  styles: (props: P) => React.CSSProperties,
): React.ComponentType<P> {
  return function WithStyles(props: P) {
    const style = styles(props)
    return <Component {...props} style={style} />
  }
}

export function withClassName<P>(
  Component: React.ComponentType<P>,
  className: (props: P) => string,
): React.ComponentType<P> {
  return function WithClassName(props: P) {
    const computedClassName = className(props)
    return <Component {...props} className={computedClassName} />
  }
}

// Component debugging utilities
export function withDebug<P>(
  Component: React.ComponentType<P>,
  debugName?: string,
): React.ComponentType<P> {
  return function WithDebug(props: P) {
    const name = debugName || Component.displayName || Component.name || 'Component'
    
    React.useEffect(() => {
      console.log(`${name} mounted:`, props)
      return () => console.log(`${name} unmounted`)
    }, [])

    React.useEffect(() => {
      console.log(`${name} updated:`, props)
    })

    return <Component {...props} />
  }
}

// Component testing utilities
export function withTestProps<P>(
  Component: React.ComponentType<P>,
  testProps: Record<string, any>,
): React.ComponentType<P> {
  return function WithTestProps(props: P) {
    const finalProps = { ...props, ...testProps }
    return <Component {...finalProps} />
  }
}

// Component accessibility utilities
export function withA11y<P>(
  Component: React.ComponentType<P>,
  a11yProps: (props: P) => React.AriaAttributes,
): React.ComponentType<P> {
  return function WithA11y(props: P) {
    const accessibilityProps = a11yProps(props)
    return <Component {...props} {...accessibilityProps} />
  }
}
