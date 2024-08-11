import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Time Zone Converter heading', () => {
  render(<App />);
  const headingElement = screen.getByText(/Time Zone Converter/i);
  expect(headingElement).toBeInTheDocument();
});