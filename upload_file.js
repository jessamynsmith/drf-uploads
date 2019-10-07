const fs = require('fs');
const http = require('http');
var AWS = require('aws-sdk');


function getFileFromS3(bucketName, keyName, callback) {
  // Create an S3 client
  var s3 = new AWS.S3();

  // Get file from bucket
  var parts = keyName.split('/');
  var filename = parts[parts.length-1];

  var params = {Bucket: bucketName, Key: keyName};
  s3.getObject(params, function(err, data) {
    if (err) {
      console.log(err);
    }
    else {
      console.log("Successfully downloaded data from " + bucketName + "/" + keyName);
      fileData = new Buffer(data.Body, 'binary');
      callback(fileData, filename);
    }
  });
}


function encodeMultipartFormData(delimeter, crlf, formData) {
      let encodedFormData = '';

      Object.keys(formData).forEach(function (paramName) {
        encodedFormData += delimeter + crlf + 'Content-Disposition: form-data; name="' + paramName + '"' +
          crlf + crlf + formData[paramName];
      });

      return encodedFormData;
}


function writeBinaryPostData(req, postData, data, filename) {

    const parts = filename.split('.');
    const fileType = parts[parts.length - 1];

    var crlf = "\r\n",
        boundaryKey = Math.random().toString(16),
        boundary = `--${boundaryKey}`,
        delimeter = `${crlf}--${boundary}`,
        headers = [
          'Content-Disposition: form-data; name="file"; filename="' + filename + '"' + crlf,
          'Content-Type: application/' + fileType + crlf,
        ],
        closeDelimeter = `${delimeter}--`,
        multipartBody;

    const encodedPostData = encodeMultipartFormData(delimeter, crlf, postData);
    const formData = encodedPostData + delimeter + crlf + headers.join('') + crlf;

    multipartBody = Buffer.concat([
      new Buffer(formData),
      data,
      new Buffer(closeDelimeter)]
    );

    req.setHeader('Content-Type', 'multipart/form-data; boundary=' + boundary);
    req.setHeader('Content-Length', multipartBody.length);

    req.write(multipartBody);
}


const uploadFile = function(fileBuffer, filename) {

  const postData = {
    'description': 'This is my file uploaded via Node.js'
  };

  const options = {
    hostname: '127.0.0.1',
    port: 8000,
    path: '/file/upload/',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    }
  };

  const req = http.request(options, (res) => {
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
      console.log(`BODY: ${chunk}`);
    });
    res.on('end', () => {
      console.log('Response is complete.');
    });
  });

  req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
  });

  writeBinaryPostData(req, postData, fileBuffer, filename);

  req.end();
};


function uploadLocalFile() {
  const filename = 'sample.pdf';
  const data = fs.readFileSync(filename);
  uploadFile(data, filename);
}

function uploadFileFromS3() {
  var bucketName = 'roxytherenovator';
  var keyName = 'media/photologue/photos/cache/tmpowlfsd10_display.jpg';
  console.log('getting file');
  getFileFromS3(bucketName, keyName, uploadFile);
}

// Uncomment one of the following:
uploadLocalFile();
// uploadFileFromS3();
