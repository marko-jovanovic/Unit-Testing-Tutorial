# Testing Guide

## Tech stack

- [Jest](https://jestjs.io/) - JavaScript testing framework and runner
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) - testing library built on top
  of DOM Testing Library by adding APIs for working with React components.
- [Test Renderer](https://reactjs.org/docs/test-renderer.html) - provides a React renderer that can be used to render
  React components to pure JavaScript objects, without depending on the DOM or a native mobile environment

## Unit tests

In the simplest terms Unit test should do what it says it does: test just one piece of a Unit. Since this definition is a bit
obscure and doesn't provide too much context let's further define on what is considered under term "unit test" and what job
unit test should perform. 

### Concepts and conventions

The unit test should respect the following concepts:

#### Test just one piece of code
Do not test multiple pieces of code within one unit test. One unit test should do just that: test one unit of code.
A unit of code could be a piece of code that solves specific problem domain written in form of a: class, service, component, hook, util or similar.
So, if your component is making interaction with 3 different classes and 2 different services, then these classes and services
should be **mocked**.

By the term **mock** we mean that these 3 classes and 2 services should be replaced by some alternative code. Why?
Because, otherwise the test would be considered an **integration** test, or to put it simply: now you are testing integration
of your code with 3 classes and 2 services.

#### Do not make any external interaction
A tested code should not interact with anything externally (avoid reading from disk, making HTTP calls or similar). Why?
Because it would simply slow down the running of the unit tests, or would require some extra setup before the tests are run.

#### Do not perform library functionality checkup
A tested code should not perform a checkup if some library has done something right or not. For example: if you are using library like
`lodash` there is no need to check if `lodash` performed something good or not, you should assume that it DOES perform as expected.
And why this? Because you are not the maintainer of `lodash`, the `lodash` should do what it claims it does.

#### Test only code branching
Try not to "over-test". Testing things like CSS classes, attributes, position, HTML structure or similar may be useful to keep track of,
but this kind of tests get messy pretty fast and hard to maintain, which is why it is important to mainly focus on testing business logic.
For testing HTML structure there is already a solution provided by Jest and that is:
[snapshot](https://jestjs.io/docs/snapshot-testing#:~:text=Snapshot%20tests%20are%20a%20very,file%20stored%20alongside%20the%20test.) testing.
And for visual testing there is [Chromatic](https://www.chromatic.com) for performing visual testing.

#### Example

For the sake of the simplicity let's take a look on the code that covers all concepts mentioned from above.
We'll take a look on a simple component that displays a list of top GitHub repos:
```typescript jsx
import { useEffect, useState } from "react";
import axios from "axios";
import LoadingSpinner from "./LoadingSpinner";
import ErrorMessage from "./ErrorMessage";
import RepositoryItem from "./RepositoryItem";
import "./styles.css";

export default function TopGitHubRepos() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [topRepositories, setTopRepositories] = useState([]);

  useEffect(() => {
    setIsLoading(true);

    // We'd like to avoid making a direct HTTP call to the server, so we should avoid that in the test
    axios
      .get("https://api.github.com/search/repositories?q=stars:%3E1&sort=stars")
      .then((response) => setTopRepositories(response.data.items))
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  // This is a great candidate for testing since this falls under conditional logic
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // This is also a good candidate for testing
  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <>
      {/* We don't want to test if someting has applied class or not */}
      {/* since this can make our test cumbersome */}
      <div className="App">
        <h1>Top GitHub repos:</h1>

        <div className="repo-list">
          {/* Here we use another component we wrote called RepositoryItem, */}
          {/* but this is a UNIT for itself so we don't neet to test any logic contained */}
          {/* within the RepositoryItem component. */}
          {topRepositories.map((repo: any) => (
            <RepositoryItem
              key={repo.id}
              name={repo.name}
              watchCount={repo.watchers}
              repositoryUrl={repo.html_url}
              homepageUrl={repo.homepage}
            />
          ))}
        </div>
      </div>
    </>
  );
}
```

Testing the component should follow this pattern:
- Mock every module that would make an external interaction (HTTP request, read from disk, etc)
- Mock (or even better: spy) every class, module or hook that you need to test if it's being called with correct parameters
- Describe what is being tested
- Write test cases inside describe
- Do a cleanup if necessary
- Make sure you provide default behaviour if you mocked out some module or function

Here is the example of such approach:

```typescript jsx
import { create, act as rtrAct } from 'react-test-renderer'
import { render, screen, act, cleanup } from '@testing-library/react';
import axios from 'axios';
import App from './App';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import RepositoryItem from './RepositoryItem';

// As we described above, we don't want 'axios' to make real HTTP calls, so we mocked out this module
jest.mock('axios');

// Because Jest does monkey patatching behind the scene, this is something a TypeScript
// is not aware of, so, we need a way to "inform" TypeScript about this
const mockAxios = axios as jest.Mocked<typeof axios>;

// It is a good practise to first describe what is being tested: component, class, hook, etc.
describe('<TopGitHubRepos />', () => {
  // Since we mocked out 'axios' module, we now need to define a default
  // behaviour for it or otherwise it will throw an error
  beforeEach(() => {
    mockAxios.get.mockResolvedValue({
      data: {
        items: []
      }
    });
  });

  // Perofrm a cleanup
  afterEach(cleanup);

  it('renders learn react link', async () => {
    render(<TopGitHubRepos />);

    // Since the mocked response is Promise-based we need to wait for an
    // event loop to finish rendering and firing all hooks
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(screen.getByText('Top GitHub repos:')).toBeInTheDocument();
  });

  it('Should render LoadingSpinner component if request is in progress', () => {
    const componentInstance = create(<TopGitHubRepos />).root;

    // There is no need to do checkup, if component is not found the test will fail
    componentInstance.findByType(LoadingSpinner);
  });

  it('Should render ErrorMessage component if request fails', async () => {
    mockAxios.get.mockRejectedValue({ message: 'A terrible error ocurred :(' });
    const componentInstance = create(<TopGitHubRepos />).root;

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
    const componentInstance = create(<TopGitHubRepos />).root;

    await rtrAct(async() => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const repositoryItems = componentInstance.findAllByType(RepositoryItem);
    expect(repositoryItems).toHaveLength(2);
  });
});

```

### Common pitfalls and edge cases

#### Partial mocking
Sometimes you'd like to mock something but just part of it and not the entire module. Luckily there is a way to do that in
Jest. For example the `@apollo/client` already provides a provider named `MockedProvider` so you could easily mock out GraphQL
response, but sometimes you'd like to test out if hook is called with right parameters because any change in the code
may result in different rendering, so we want to make sure that the exact request is being made each time.
To do this you'd have to write something like this:

```typescript jsx
// Here we are first telling Jest to mock out the entire module, but inside factory function we are
// calling the real implementation of module and then mock just `useApolloClient` hook.
import { useQuery } from '@apollo/client';

jest.mock('@apollo/client', () => {
  return {
    ...jest.requireActual('@apollo/client'),
    useQuery: jest.fn(),
  }
});

// As we described above in the test example, this is a way of making TypeScript aware that there has been done some
// monkey patching in the background by Jest
const mockUseQuery = useQuery as jest.Mock;
```

### How to run tests?

To run the tests you'd simply have to run the following command: `yarn test`.

Sometimes you may want to run just a single test file, and to do this in modern IDEs like WebStorm is just a matter of click through UI.
To do this in the console you'd need to run the following command: `yarn test -- -t '<name-of-the-test>'`.
So, if your test starts with `describe('my-test')`, then you should run the following command: `yarn test -- -t 'my-test'`

This is also another reason why is it useful to use `describe()` inside unit tests, because otherwise you'd have to specify
the full path to the test file, for example: `yarn test src/TopGitHubRepos.test.tsx`
