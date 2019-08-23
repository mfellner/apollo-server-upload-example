import React from 'react';
import { ApolloProvider } from '@apollo/react-hooks';
import CssBaseline from '@material-ui/core/CssBaseline';
import { makeStyles } from '@material-ui/styles';
import FileUpload from './file-upload';

const useStyles = makeStyles({
  wrapper: {
    padding: 10,
  },
});

export default function App({ apolloClient }) {
  const classes = useStyles();
  return (
    <ApolloProvider client={apolloClient}>
      <>
        <CssBaseline />
        <section className={classes.wrapper}>
          <FileUpload />
        </section>
      </>
    </ApolloProvider>
  );
}
