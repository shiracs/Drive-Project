import { Navigate } from 'react-router-dom';
import { getTokenHeader } from '../utils/auth';

const ProtectedRoute = ({ children }) => {
    const auth = getTokenHeader();

    // If no auth token, redirect to login
    if (!auth.Authorization) {
        return <Navigate to="/login" replace />;
    }

    // Otherwise, render the child components
    return children;
};

export default ProtectedRoute;