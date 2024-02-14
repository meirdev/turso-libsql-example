terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.36.0"
    }
  }
}

variable "TURSO_URL" {
  type = string
}

variable "TURSO_AUTH_TOKEN" {
  type      = string
  sensitive = true
}

data "archive_file" "lambda_function_archive" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda/"
  output_path = "${path.module}/../lambda_function.zip"
}

resource "aws_lambda_function" "my_lambda_function" {
  filename         = data.archive_file.lambda_function_archive.output_path
  source_code_hash = data.archive_file.lambda_function_archive.output_base64sha256
  function_name    = "UrlShortener"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "url-shortener.handler"
  runtime          = "nodejs20.x"
  architectures    = ["arm64"]
  timeout          = 60

  environment {
    variables = {
      TURSO_URL        = var.TURSO_URL
      TURSO_AUTH_TOKEN = var.TURSO_AUTH_TOKEN
    }
  }
}

resource "aws_lambda_function_url" "my_lambda_function_url" {
  function_name      = aws_lambda_function.my_lambda_function.function_name
  authorization_type = "NONE"
}

data "aws_iam_policy" "lambda_basic_execution_policy" {
  arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role" "lambda_exec" {
  name = "lambda_exec_role"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      }
    }
  ]
}
EOF
}

resource "aws_iam_role_policy_attachment" "lambda_flow_log_cloudwatch" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = data.aws_iam_policy.lambda_basic_execution_policy.arn
}

output "function_url" {
  value = aws_lambda_function_url.my_lambda_function_url.function_url
}
