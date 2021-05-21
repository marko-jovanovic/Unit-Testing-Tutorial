import { create, act as rtrAct } from 'react-test-renderer'
import { render, screen, act, cleanup } from '@testing-library/react';
import axios from 'axios';
import App from './App';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import RepositoryItem from './RepositoryItem';

jest.mock('axios');

// Because Jest does monkey patatching behind the scene, this is something a TypeScript
// is not aware of, so, we need a way to "inform" TypeScript about this
const mockAxios = axios as jest.Mocked<typeof axios>;

describe('<App />', () => {
  beforeEach(() => {
    mockAxios.get.mockResolvedValue({
      data: {
        items: []
      }
    });
  });

  afterEach(cleanup);

  it('match snapshot', async () => {
    const component = create(<App />);

    // Since the mocked response is Promise-based we need to wait for an event loop to finish
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(component.toJSON()).toMatchSnapshot();
  });
  
  it('renders learn react link', async () => {
    render(<App />);

    // Since the mocked response is Promise-based we need to wait for an event loop to finish
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(screen.getByText('Top GitHub repos:')).toBeInTheDocument();
  });

  it('Should render LoadingSpinner component if request is in progress', () => {
    const componentInstance = create(<App />).root;

    // There is no need to do checkup, if component is not found the test will fail
    componentInstance.findByType(LoadingSpinner);
  });

  it('Should render ErrorMessage component if request fails', async () => {
    mockAxios.get.mockRejectedValue({ message: 'A terrible error ocurred :(' });
    const componentInstance = create(<App />).root;

    await rtrAct(async() => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    componentInstance.findByType(ErrorMessage);
  });

  it('Should render 2 RepositoryItem components if request is successful', async () => {
    mockAxios.get.mockResolvedValue({
      data: {
        items: [
          {
            id: 28457823,
            watchers: 323864,
            homepage: 'https://contribute.freecodecamp.org',
            name: 'freeCodeCamp'
          },
          {
            id: 177736533,
            watchers: 256883,
            homepage: 'https://996.icu',
            name: '996.ICU'
          }
        ]
      }
    });
    const componentInstance = create(<App />).root;

    await rtrAct(async() => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const repositoryItems = componentInstance.findAllByType(RepositoryItem);
    expect(repositoryItems).toHaveLength(2);
  });
});
