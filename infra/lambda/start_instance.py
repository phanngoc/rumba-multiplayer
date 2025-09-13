import boto3
import os
import json

def handler(event, context):
    """
    Lambda function to start EC2 instance
    """
    try:
        # Get instance ID from environment variable
        instance_id = os.environ['INSTANCE_ID']
        
        # Create EC2 client
        ec2_client = boto3.client('ec2')
        
        # Check current instance state
        response = ec2_client.describe_instances(InstanceIds=[instance_id])
        current_state = response['Reservations'][0]['Instances'][0]['State']['Name']
        
        print(f"Current instance state: {current_state}")
        
        # Only start if instance is stopped
        if current_state == 'stopped':
            # Start the instance
            response = ec2_client.start_instances(InstanceIds=[instance_id])
            print(f"Starting instance {instance_id}")
            
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': f'Successfully initiated start for instance {instance_id}',
                    'previousState': current_state
                })
            }
        else:
            print(f"Instance {instance_id} is already in state: {current_state}")
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': f'Instance {instance_id} is already in state: {current_state}',
                    'currentState': current_state
                })
            }
            
    except Exception as e:
        print(f"Error starting instance: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': f'Failed to start instance: {str(e)}'
            })
        }
