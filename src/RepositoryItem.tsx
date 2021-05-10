import React from "react";

interface RepositoryItemProps {
  name: string;
  watchCount: number;
  homepageUrl: string;
  repositoryUrl: string;
}

const RepositoryItem: React.FC<RepositoryItemProps> = ({
  name,
  watchCount,
  homepageUrl,
  repositoryUrl
}) => {
  return (
    <div className="repository-item">
      <p className="repo-name">
        <a href={repositoryUrl} target="_blank" rel="noopener noreferrer">
          <span>{name}</span>
          <span> ({watchCount} watchers)</span>
        </a>

        {homepageUrl && repositoryUrl && homepageUrl !== repositoryUrl && (
          <>
            <span> - </span>
            <a href={homepageUrl} target="_blank" rel="noopener noreferrer">
              Home Page
            </a>
          </>
        )}
      </p>
    </div>
  );
};

export default RepositoryItem;
