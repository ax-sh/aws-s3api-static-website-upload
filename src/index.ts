import {
  CreateBucketCommand,
  DeleteBucketWebsiteCommand,
  GetBucketWebsiteCommand,
  PutBucketPolicyCommand,
  PutBucketWebsiteCommand,
  PutObjectCommand,
  PutPublicAccessBlockCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import type { S3ClientConfig } from '@aws-sdk/client-s3/dist-types/S3Client';
import { $ } from 'bun';
import fs from 'node:fs';
import path from 'node:path';

const Region = 'us-east-1';

const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID as string;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY as string;
const MOCK_MODE = true;

const config: S3ClientConfig = {
  region: Region,

  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID, // Provide your AWS access key ID here if not using default credentials
    secretAccessKey: AWS_SECRET_ACCESS_KEY, // Provide your AWS secret access key here if not using default credentials
  },
};
if (MOCK_MODE) {
  config.endpoint = 'http://s3.localhost.localstack.cloud:4566'; // disable this to go live
}
const s3 = new S3Client(config);

async function createBucket(bucketName: string) {
  const command = new CreateBucketCommand({
    Bucket: bucketName,
  });
  const { Location, ...data } = await s3.send(command);
  console.log('[createBucket]', Location);
  console.debug(data);
}

function printUrl() {
  // s3-website dash (-) Region ‐
  const url = `http://${bucketName}.s3-website-${Region}.amazonaws.com`;

  // s3-website dot (.) Region ‐
  const _url = `http://${bucketName}.s3-website.${Region}.amazonaws.com`;
  console.log('Website configuration added successfully.');
  console.log(url);
  console.log(_url);
}

// Add the website configuration.
async function configureBucketWebsite(bucketName: string) {
  try {
    const cmd = new PutBucketWebsiteCommand({
      Bucket: bucketName,
      WebsiteConfiguration: {
        IndexDocument: { Suffix: 'index.html' },
        // ErrorDocument: { Key: 'error.html' },
      },
    });
    const { ...data } = await s3.send(cmd);
    console.log('configureBucketWebsite', data);
  } catch (err) {
    console.error('Error configuring bucket website:', err);
  }
}

// Retrieve the website configuration.
async function getBucketWebsite(bucketName: string) {
  try {
    const { IndexDocument, ...data } = await s3.send(
      new GetBucketWebsiteCommand({ Bucket: bucketName })
    );

    if (IndexDocument?.Suffix) {
      console.log('Index document suffix:', IndexDocument.Suffix);
    } else {
      console.log('Website configuration not found.');
    }
    console.log(data);
  } catch (err) {
    console.error('Error retrieving bucket website configuration:', err);
  }
}

// Delete the website configuration.
async function deleteBucketWebsite(bucketName: string) {
  try {
    await s3.send(new DeleteBucketWebsiteCommand({ Bucket: bucketName }));

    console.log('Website configuration deleted successfully.');
  } catch (err) {
    console.error('Error deleting bucket website configuration:', err);
  }
}

async function putBucketPolicy(bucketName: string) {
  const policy = {
    Version: '2012-10-17',
    Statement: [
      {
        Sid: 'PublicReadGetObject',
        Effect: 'Allow',
        Principal: '*',
        Action: ['s3:GetObject'],
        Resource: [`arn:aws:s3:::${bucketName}/*`],
      },
    ],
  };

  const command = new PutBucketPolicyCommand({
    Policy: JSON.stringify(policy),
    Bucket: bucketName,
  });
  const { ...data } = await s3.send(command);
  console.log('putBucketPolicy', data);
}

// Delete the website configuration.
async function uploadBucketWebsite(bucketName: string) {
  let cmd: string;
  if (MOCK_MODE) {
    cmd =
      await $`aws s3 cp dist s3://${bucketName}/ --recursive --endpoint-url=http://localhost:4566`.text();
  } else {
    cmd = await $`aws s3 cp dist s3://${bucketName}/ --recursive`.text();
  }

  console.log('uploadBucketWebsite', cmd);
}

async function putPublicAccessBlockPublic(bucketName: string) {
  const params = {
    Bucket: bucketName,
    PublicAccessBlockConfiguration: {
      BlockPublicPolicy: false,
      BlockPublicAcls: false,
      IgnorePublicAcls: false,
      RestrictPublicBuckets: false,
    },
  };
  try {
    const { $metadata } = await s3.send(new PutPublicAccessBlockCommand(params));
    console.log('Success', $metadata);
  } catch (err) {
    console.log('Error', err);
  }
}

// Function to get all files in a directory recursively
function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
}

// Function to upload a file to S3
async function uploadFile(filePath: string, bucket: string, s3Client: S3Client) {
  const fileStream = fs.createReadStream(filePath);
  const s3Key = path.relative(process.cwd(), filePath); // Adjust the S3 key as needed

  const uploadParams = {
    Bucket: bucket,
    Key: s3Key,
    Body: fileStream,
  };

  try {
    await s3Client.send(new PutObjectCommand(uploadParams));
    console.log(`Successfully uploaded ${filePath} to ${bucket}/${s3Key}`);
  } catch (err) {
    console.error(`Error uploading ${filePath}:`, err);
  }
}

// Function to upload a folder to S3
async function uploadFolder(folderPath: string, bucket: string) {
  const files = getAllFiles(folderPath);

  for (const file of files) {
    await uploadFile(file, bucket, s3);
  }
}

// https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html

const bucketName = 'bucket-web-2024';

// // console.log(_url);
// // console.log(url);
//
// // usage:
// await createBucket(bucketName);
// const folderPath = path.join(__dirname,  'dist'); // Replace with your folder path
// // await uploadFolder(folderPath, bucketName)
// await uploadBucketWebsite(bucketName);
// await configureBucketWebsite(bucketName);
// // await getBucketWebsite(bucketName);
// await putPublicAccessBlockPublic(bucketName)
// await putBucketPolicy(bucketName);
// // await deleteBucketWebsite(bucketName);
printUrl();
