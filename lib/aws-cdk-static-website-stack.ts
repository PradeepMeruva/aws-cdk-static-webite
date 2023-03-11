import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as yaml from 'js-yaml'; 
import * as fs from 'fs';


export interface ConfigData { 

  domain: string,
  subDomain : string
  hostedZoneID: string

}



export class AwsCdkStaticWebsiteStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const config = fs.readFileSync('config.yaml', 'utf8');
    const configData : ConfigData = <ConfigData> yaml.load(config);

   console.log("configDate.domain  : ############# " , configData.domain);
   console.log("configData.Subdomain  : ############# " , configData.subDomain);
   console.log("configData.hostedZoneID  : ############# " , configData.hostedZoneID);


   console.log("config : ############# ", config );

   
    const bucket = new s3.Bucket(this, configData.subDomain+'-'+configData.domain, {
      bucketName:  configData.subDomain+'.'+configData.domain,
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
      hostedZoneId: configData.hostedZoneID, // Provide correct hostedzoneid
      zoneName: configData.domain, 
    
    })




    // // Create an ACM certificate for the website
    const certificate = new acm.Certificate(this, 'SiteCertificate', {
      domainName:  '*.'+configData.domain, //'*.configData.domain',
      validation: acm.CertificateValidation.fromDns(siteHostedZone),
    });

    // Create a CloudFront distribution for the website
    const distribution = new cloudfront.Distribution(this, 'SiteDistribution', {
      defaultBehavior: { origin: new origins.S3Origin(bucket), viewerProtocolPolicy : cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS },
      domainNames: [ configData.subDomain+'.' +  configData.domain],
  
      certificate: certificate,
      
    });



    new route53.ARecord(this, 'siteRecord', {
      zone: siteHostedZone,
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
      recordName: configData.subDomain+'.'+ configData.domain,
      ttl : cdk.Duration.seconds(30),

      
    });


  }
}
