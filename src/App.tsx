import axios from 'axios';
import { useEffect, useState } from 'react';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import RepositoryItem from './RepositoryItem';
import './App.css';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [topRepositories, setTopRepositories] = useState([]);

  useEffect(() => {
    setIsLoading(true);

    axios
      .get("https://api.github.com/search/repositories?q=stars:%3E1&sort=stars")
      .then((response) => {
        console.log(response.data.items);
        setTopRepositories(response.data.items);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="App">
      <h1>Top GitHub repos:</h1>
      <div className="repo-list">
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
  );
}

export default App;
