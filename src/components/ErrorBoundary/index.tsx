import React from "react";

type ErrorBoundaryProps = {};
interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: Readonly<ErrorBoundaryState> = {
    hasError: false
  };

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Display fallback UI
    this.setState({ hasError: true });
    // You can also log the error to an error reporting service
    //logErrorToMyService(error, info);
    console.log(error);
    console.log(info);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div>
          <img src="imgs/undraw_bug_fixing.png" />
          <h1>Oh no... Something went wrong.</h1>
          <p>
            Please double check you have extracted the model correctly. If
            problems continue, please forward me a copy your model and I can
            look into the issue (luke@matrado.ca).
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
