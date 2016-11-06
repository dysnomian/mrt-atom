# Elixir test watcher for atom

This plugin depends on a working installation of MrT (https://github.com/ruby2elixir/mr_t) in your
project. To do this, simply add MrT to your mix.exs dependencies:

```
def deps do
  [{:mr_t, "~> 0.6.0", only: [:test, :dev]}]
end
```

Internally, the plugin runs `MIX_ENV=test /usr/local/bin/iex -S mix run -e 'MrT.start'` and listens
for potential notifications. If a failed test is detected, the corresponding source file is
highlighted. If a compilation error occurs, the user gets a direct popup notification.

![Preview](https://raw.githubusercontent.com/chriserik/mrt-atom/master/record_01.gif)


