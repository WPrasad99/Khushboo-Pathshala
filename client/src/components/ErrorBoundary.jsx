import { Component } from 'react';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '300px',
                    padding: '40px',
                    textAlign: 'center',
                    background: 'var(--admin-surface, #fff)',
                    borderRadius: '16px',
                    border: '1px solid var(--admin-border-color, #e2e8f0)',
                    margin: '20px'
                }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #fee2e2, #fecaca)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '16px',
                        fontSize: '28px'
                    }}>
                        ⚠️
                    </div>
                    <h3 style={{
                        margin: '0 0 8px',
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        color: 'var(--admin-text-primary, #1e293b)'
                    }}>
                        Something went wrong
                    </h3>
                    <p style={{
                        margin: '0 0 20px',
                        fontSize: '0.875rem',
                        maxWidth: '400px',
                        fontFamily: 'monospace',
                        color: 'red'
                    }}>
                        {this.state.error?.message || 'This section encountered an unexpected error.'}
                    </p>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            onClick={this.handleReset}
                            style={{
                                padding: '10px 24px',
                                background: 'var(--admin-accent-primary, #6366f1)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontSize: '0.875rem'
                            }}
                        >
                            Try Again
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            style={{
                                padding: '10px 24px',
                                background: 'transparent',
                                color: 'var(--admin-text-secondary, #64748b)',
                                border: '1px solid var(--admin-border-color, #e2e8f0)',
                                borderRadius: '8px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontSize: '0.875rem'
                            }}
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
