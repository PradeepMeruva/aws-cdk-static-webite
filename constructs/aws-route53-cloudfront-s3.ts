import * as s3 from "aws-cdk-lib/aws-s3";


export interface Route53CloudfrontS3Props {


/**
* Optional properties to customize the bucket used to store the ALB Access
* Logs. Supplying this and setting logAccessLogs to false is an error.
*
* @default - none
*/
readonly websiteBucketProps?: s3.BucketProps,





}

