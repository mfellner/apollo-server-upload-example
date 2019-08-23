import React from 'react';
import { useMutation, useQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import LinearProgress from '@material-ui/core/LinearProgress';
import Typography from '@material-ui/core/Typography';

export default function FileUpload() {
  const queryResult = useQuery(
    gql`
      {
        uploads {
          filename
          mimetype
          encoding
        }
      }
    `,
  );

  const [uploadFile, uploadResult] = useMutation(gql`
    mutation uploadFile($file: Upload!) {
      uploadFile(file: $file) {
        filename
        mimetype
        encoding
      }
    }
  `);

  const onFileChange = event => {
    const file = event.target.files[0];
    uploadFile({ variables: { file } });
  };

  const error = queryResult.error || uploadResult.error;
  if (error) {
    return <Typography color="error">{error.toString()}</Typography>;
  }

  const loading = queryResult.loading || uploadResult.loading;
  const data = queryResult.data || uploadResult.data;
  if (loading || !data) {
    return <LinearProgress />;
  }

  return (
    <>
      <input type="file" id="input" onChange={onFileChange} />
      <Typography>{data.uploads}</Typography>
    </>
  );
}
