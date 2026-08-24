import { SearchForm } from './SearchForm';
import styles from './page.module.css';

export default function SearchPage() {
  return (
    <div className={styles.wrap}>
      <SearchForm />
    </div>
  );
}
