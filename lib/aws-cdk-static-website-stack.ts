import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';

export class AwsCdkStaticWebsiteStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

   
    const bucket = new s3.Bucket(this, 'StaticSiteBucket', {
      bucketName: 'resume.example.com',
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'error.html',
      publicReadAccess: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY
   
    });

    new s3deploy.BucketDeployment(this, 'MyDeployment', {
      sources: [s3deploy.Source.asset('static-website-files')],
      destinationBucket: bucket,
    });


    



    const siteHostedZone = route53.HostedZone.fromHostedZoneAttributes(this,'siteHostedZone',  { 
      hostedZoneId: 'XXXXXXXXXXXX', // Provide correct hostname
      zoneName: 'example.com', 
    
    })




    // // Create an ACM certificate for the website
    const certificate = new acm.Certificate(this, 'SiteCertificate', {
      domainName: '*.example.com',
      validation: acm.CertificateValidation.fromDns(siteHostedZone),
    });

    // Create a CloudFront distribution for the website
    const distribution = new cloudfront.Distribution(this, 'SiteDistribution', {
      defaultBehavior: { origin: new origins.S3Origin(bucket), viewerProtocolPolicy : cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS },
      domainNames: ['test.example.com'],
      certificate: certificate,
      
    });



    new route53.ARecord(this, 'siteRecord', {
      zone: siteHostedZone,
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
      recordName: 'test.example.com',
      ttl : cdk.Duration.seconds(30),

      
    });


  }
}
