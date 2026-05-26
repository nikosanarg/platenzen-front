import styled from 'styled-components';

export const RecordsRoot = styled.section``;

export const RecordsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;

  @media (max-width: 600px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

export const RecordCard = styled.div`
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1.25rem 1.125rem;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
`;

export const RecordCategory = styled.div`
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
`;

export const RecordValue = styled.div`
  font-size: 1.625rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.02em;
  line-height: 1.1;
`;

export const RecordUnit = styled.span`
  font-size: 0.9rem;
  font-weight: 400;
  color: var(--text-secondary);
  margin-left: 0.25rem;
`;

export const RecordSub = styled.div`
  font-size: 0.75rem;
  color: var(--text-secondary);
`;

export const RecordDate = styled.div`
  font-size: 0.7rem;
  color: var(--text-muted);
  margin-top: 0.125rem;
`;

export const RecordActivity = styled.div`
  font-size: 0.7rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;
