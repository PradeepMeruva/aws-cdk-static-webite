import { Stack, StackProps } from 'aws-cdk/core';
import { Bucket, BucketAccessControl, BlockPublicAccess, IBucket } from '@aws-cdk/aws-s3';
import { CloudFrontWebDistribution, OriginAccessIdentity, PriceClass } from '@aws-cdk/aws-cloudfront';
import { S3Origin } from '@aws-cdk/aws-cloudfront-origins';
import { ARecord, RecordTarget } from '@aws-cdk/aws-route53';
import { CloudFrontTarget } from '@aws-cdk/aws-route53-targets';

interface WebsiteStackProps extends StackProps {
  zoneId: string;
  domainName: string;
}

export class WebsiteStack extends Stack {
  public readonly bucket: IBucket;

  constructor(scope: Construct, id: string, props: WebsiteStackProps) {
    super(scope, id, props);

    // Create S3 bucket for hosting static website
    this.bucket = new Bucket(this, 'WebsiteBucket', {
      bucketName: props.domainName,
      websiteIndexDocument: 'index.html',
      accessControl: BucketAccessControl.PUBLIC_READ,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL
    });

    // Add bucket policy to allow public access to the website content
    this.bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:GetObject'],
        resources: [`${this.bucket.bucketArn}/*`],
        principals: [new iam.AnyPrincipal()],
        conditions: {
          'IpAddress': {
            'aws:SourceIp': '0.0.0.0/0'
          }
        }
      })
    );

    // Create CloudFront distribution for the website
    const myOAI = new OriginAccessIdentity(this, 'WebsiteOAI');

    const myDistribution = new CloudFrontWebDistribution(this, 'WebsiteDistribution', {
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: this.bucket,
            originAccessIdentity: myOAI
          },
          behaviors: [
            {
              isDefaultBehavior: true
            }
          ]
        }
      ],
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      priceClass: PriceClass.PRICE_CLASS_ALL
    });

    // Add A record to Route53 to map the domain name to the CloudFront distribution
    new ARecord(this, 'WebsiteARecord', {
      zoneId: props.zoneId,
      target: RecordTarget.fromAlias(new CloudFrontTarget(myDistribution)),
      recordName: props.domainName
    });
  }
}
