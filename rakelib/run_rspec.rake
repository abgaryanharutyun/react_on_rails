require "coveralls/rake/task"
require "pathname"
require_relative "task_helpers"
include ReactOnRails::TaskHelpers

namespace :run_rspec do
  desc "Run RSpec for top level only"
  task :gem do
    run_tests_in("", rspec_args: "spec/react_on_rails")
  end

  desc "Run RSpec for spec/dummy only"
  task :dummy do
    run_tests_in("spec/dummy", env_vars: "DRIVER=selenium_firefox")
  end

  desc "Run RSpec for spec/dummy_react_013 only"
  task :dummy_react_013 do
    run_tests_in("spec/dummy-react-013", env_vars: "DRIVER=selenium_firefox")
  end

  # Dynamically define Rake tasks for each example app found in the examples directory
  example_app_dirs.each do |example_app_dir|
    desc "Runs RSpec for #{File.basename(example_app_dir)} example app only"
    task "example_#{File.basename(example_app_dir)}" do
      run_tests_in("#{File.basename(examples_dir)}/#{File.basename(example_app_dir)}")
    end
  end

  desc "Runs Rspec for examples only"
  task :examples do
    example_app_dirs.each do |example_app_dir|
      Rake::Task["run_rspec:example_#{File.basename(example_app_dir)}"].invoke
    end
  end

  desc "Run RSpec on spec/empty_spec in order to have SimpleCov generate a coverage report from cache"
  task :empty do
    sh %(COVERAGE=true rspec spec/empty_spec.rb)
  end

  Coveralls::RakeTask.new

  task run_rspec: [:gem, :dummy, :dummy_react_013, :examples, :empty, "coveralls:push"] do
    puts "Completed all RSpec tests"
  end
end

desc "Runs all tests. Run `rake -D run_rspec` to see all available test options"
task run_rspec: ["run_rspec:run_rspec"]

private

# Runs rspec in the given directory (if string is passed, assumed to be relative
# to root of the gem.
# TEST_ENV_COMMAND_NAME is used to make SimpleCov.command_name unique in order to
# prevent a name collision. Defaults to the given directory's name.
def run_tests_in(dir, options = {})
  dir = Pathname.new(File.join(gem_root, dir)) if dir.is_a?(String)
  command_name = options.fetch(:command_name, dir.basename)
  rspec_args = options.fetch(:rspec_args, "")
  env_vars = %(#{options.fetch(env_vars, '')} COVERAGE=true TEST_ENV_COMMAND_NAME="#{command_name}")
  sh_in_dir(dir, "#{env_vars} bundle exec rspec #{rspec_args}")
end

def example_app_dirs
  Dir.foreach(examples_dir).reject { |dir| dir == "." || dir == ".." }
end
